from datetime import datetime, timedelta
import pytest
from sqlalchemy import select, func, create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from ..models import User, Task, Category, Tag, Status, task_tag, Base


@pytest.fixture()
def engine():
    eng = create_engine(
        "sqlite+pysqlite:///:memory:",
        poolclass=StaticPool,
    )

    Base.metadata.create_all(eng)

    try:
        yield eng
    finally:
        eng.dispose()


@pytest.fixture()
def session(engine):
    with Session(
        engine,
        expire_on_commit=False,
    ) as s:
        yield s


# --- 1) User creation & uniqueness ------------------------------------------


def test_user_creation_and_uniqueness(session):
    u = User(
        username="alice",
        email="a@example.com",
        user_pin=1111,
        created_on=datetime.now(),
    )
    session.add(u)
    session.commit()
    assert u.id is not None

    # unique username
    session.add(
        User(
            username="alice",
            email="b@example.com",
            user_pin=2222,
            created_on=datetime.now(),
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()

    # unique email
    session.add(
        User(
            username="bob",
            email="a@example.com",
            user_pin=3333,
            created_on=datetime.now(),
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# --- 2) Task creation & FK relationships ------------------------------------


def test_task_creation_and_relationships(session):
    u = User(
        username="chris",
        email="c@example.com",
        user_pin=1234,
        created_on=datetime.now(),
    )
    st = Status(
        title="OPEN",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    cat = Category(
        name="General",
        color_hex="999999",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    session.add_all([u, st, cat])
    session.commit()

    due = datetime.now() + timedelta(days=2)
    t = Task(
        title="Write docs",
        description="draft",
        notes=None,
        created_by=u.id,
        status_id=st.id,
        category_id=cat.id,
        due_date=due,
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    session.add(t)
    session.commit()

    got = session.get(Task, t.id)
    assert got is not None
    assert got.user.id == u.id
    assert got.status.id == st.id
    assert got.category.id == cat.id
    assert got.due_date == due


# --- 3) Many tags (M2M) & both directions -----------------------------------


def test_task_with_multiple_tags(session):
    u = User(
        username="dana",
        email="d@example.com",
        user_pin=4444,
        created_on=datetime.now(),
    )
    st = Status(
        title="IN_PROGRESS",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    t = Task(
        title="Tag me",
        created_by=1,  # will set after commit
        status_id=1,  # will set after commit
        due_date=datetime.now(),
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    # add in two steps so we can use real IDs
    session.add_all([u, st])
    session.commit()
    t.created_by = u.id
    t.status_id = st.id

    tag1 = Tag(
        name="prototype",
        color_hex="3366FF",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    tag2 = Tag(
        name="school",
        color_hex="FF9933",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    session.add_all([t, tag1, tag2])
    session.commit()

    t.tags.extend([tag1, tag2])
    session.commit()

    got = session.get(Task, t.id)
    assert {tg.name for tg in got.tags} == {"prototype", "school"}

    # reverse direction (Tag -> tasks)
    got_tag = session.get(Tag, tag1.id)
    assert any(task.id == t.id for task in got_tag.tasks)


# --- 4) Parent/child (subtasks) relationship --------------------------------


def test_parent_child_subtasks(session):
    u = User(
        username="eve",
        email="e@example.com",
        user_pin=5555,
        created_on=datetime.now(),
    )
    st = Status(
        title="BLOCKED",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    session.add_all([u, st])
    session.commit()

    parent = Task(
        title="Parent",
        created_by=u.id,
        status_id=st.id,
        due_date=datetime.now(),
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    c1 = Task(
        title="Child 1",
        created_by=u.id,
        status_id=st.id,
        due_date=datetime.now(),
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    c2 = Task(
        title="Child 2",
        created_by=u.id,
        status_id=st.id,
        due_date=datetime.now(),
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    session.add_all([parent, c1, c2])
    session.commit()

    parent.subtasks.extend([c1, c2])
    session.commit()

    p = session.get(Task, parent.id)
    assert {t.title for t in p.subtasks} == {"Child 1", "Child 2"}
    assert session.get(Task, c1.id).parent_task.id == parent.id


# --- 5) Cascade behaviors on delete -----------------------------------------


def test_cascade_delete_user_deletes_tasks(session):
    u = User(
        username="fred",
        email="f@example.com",
        user_pin=6666,
        created_on=datetime.now(),
    )
    st = Status(
        title="TEMP",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    session.add_all([u, st])
    session.commit()

    t = Task(
        title="to be deleted with user",
        created_by=u.id,
        status_id=st.id,
        due_date=datetime.now(),
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    session.add(t)
    session.commit()
    tid = t.id

    # delete the user → Task.created_by has ondelete="CASCADE"
    session.delete(u)
    session.commit()

    assert session.get(User, u.id) is None
    assert session.get(Task, tid) is None  # task removed


def test_delete_category_sets_task_category_null(session):
    u = User(
        username="gina",
        email="g@example.com",
        user_pin=7777,
        created_on=datetime.now(),
    )
    st = Status(
        title="TEMP2",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    cat = Category(
        name="Disposable",
        color_hex="ABCDEF",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    session.add_all([u, st, cat])
    session.commit()

    t = Task(
        title="lose my category",
        created_by=u.id,
        status_id=st.id,
        category_id=cat.id,
        due_date=datetime.now(),
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    session.add(t)
    session.commit()
    tid = t.id

    # delete the category → Task.category_id has ondelete="SET NULL"
    session.delete(cat)
    session.commit()

    assert session.get(Task, tid).category_id is None


def test_delete_task_clears_m2m_links_but_keeps_tags(session):
    u = User(
        username="hank",
        email="h@example.com",
        user_pin=8888,
        created_on=datetime.now(),
    )
    st = Status(
        title="READY",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    session.add_all([u, st])
    session.commit()

    t = Task(
        title="linked task",
        created_by=u.id,
        status_id=st.id,
        due_date=datetime.now(),
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    tag = Tag(
        name="keep_me",
        color_hex="00FF00",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    session.add_all([t, tag])
    session.commit()

    t.tags.append(tag)
    session.commit()

    # count link rows
    before = session.execute(select(func.count()).select_from(task_tag)).scalar_one()
    assert before >= 1

    # delete task → link rows have FK(ondelete=CASCADE) so they’re removed
    session.delete(t)
    session.commit()

    after = session.execute(select(func.count()).select_from(task_tag)).scalar_one()
    assert after == 0  # association rows gone
    # tag itself should remain
    assert session.get(Tag, tag.id) is not None


def test_delete_parent_task_deletes_subtasks(session):
    u = User(
        username="ira",
        email="i@example.com",
        user_pin=9999,
        created_on=datetime.now(),
    )
    st = Status(
        title="PARENT",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    session.add_all([u, st])
    session.commit()

    parent = Task(
        title="parent",
        created_by=u.id,
        status_id=st.id,
        due_date=datetime.now(),
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    c = Task(
        title="child",
        created_by=u.id,
        status_id=st.id,
        due_date=datetime.now(),
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    session.add_all([parent, c])
    session.commit()
    parent.subtasks.append(c)
    session.commit()
    cid = c.id

    # delete parent → children removed (relationship delete-orphan + FK CASCADE)
    session.delete(parent)
    session.commit()
    assert session.get(Task, cid) is None


# --- 6) Retrieve status of a task -------------------------------------------


def test_retrieve_status_of_task(session):
    u = User(
        username="jane",
        email="j@example.com",
        user_pin=1357,
        created_on=datetime.now(),
    )
    st = Status(
        title="DONE",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    session.add_all([u, st])
    session.commit()

    t = Task(
        title="finish me",
        created_by=u.id,
        status_id=st.id,
        due_date=datetime.now(),
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    session.add(t)
    session.commit()

    got = session.get(Task, t.id)
    assert got.status.title == "DONE"


# --- 7) Extra relationship sanity checks (back_populates) --------------------


def test_back_populates_collections(session):
    u = User(
        username="kate",
        email="k@example.com",
        user_pin=2468,
        created_on=datetime.now(),
    )
    st = Status(
        title="QUEUED",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    cat = Category(
        name="Study",
        color_hex="123456",
        created_on=datetime.now(),
        updated_on=datetime.now(),
        created_by=0,
    )
    session.add_all([u, st, cat])
    session.commit()

    t = Task(
        title="study orm",
        created_by=u.id,
        status_id=st.id,
        category_id=cat.id,
        due_date=datetime.now(),
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    session.add(t)
    session.commit()

    # user.tasks should contain t
    assert any(x.id == t.id for x in session.get(User, u.id).tasks)
    # category.tasks should contain t
    assert any(x.id == t.id for x in session.get(Category, cat.id).tasks)
    # status.tasks should contain t
    assert any(x.id == t.id for x in session.get(Status, st.id).tasks)
