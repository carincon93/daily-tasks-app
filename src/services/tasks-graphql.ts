import { Category, Session, Task, User } from "@/lib/types";

const API_URL = import.meta.env.VITE_HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET;

const fetchTasks = async (user_id: string): Promise<Task[]> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
          query get_tasks_by_user($user_id: uuid!) {
            tasks(where: {user_id: {_eq: $user_id}}) {
              id
              category_id
              category {
                name
                color
              }
              user_id
              description
              emoji
              milliseconds
              date
              strikethrough
              is_visible
            }
          }
        `,
      variables: {
        user_id,
      },
    }),
  });

  const result = await response.json();
  return result.data.tasks;
};

const createTask = async (task: Partial<Task>): Promise<Task> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation insert_single_task($object: tasks_insert_input!) {
          insert_tasks_one(object: $object) {
            id
            category_id
            user_id
            description
            emoji
            milliseconds
            date
            strikethrough
            is_visible
          }
        }
      `,
      variables: {
        object: {
          category_id: task.category_id,
          user_id: task.user_id,
          description: task.description,
          emoji: task.emoji,
          milliseconds: 0,
          date: new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          strikethrough: false,
          is_visible: true,
        },
      },
    }),
  });

  const result = await response.json();

  return result.data.insert_tasks_one;
};

const findTask = async (task: Partial<Task>): Promise<Task> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        query get_task_by_pk($id: uuid!) {
          tasks(where: {id: {_eq: $id}}, limit: 1) {
            milliseconds
          }
        }
      `,
      variables: {
        id: task.id,
      },
    }),
  });

  const result = await response.json();

  return result.data.tasks[0];
};

const updateTask = async (task: Partial<Task>): Promise<Task> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation update_single_task($id: uuid!, $_set: tasks_set_input!) {
          update_tasks_by_pk(pk_columns: {id: $id}, _set: $_set) {
            id
            category_id
            category {
              name
              color
            }
            user_id
            description
            emoji
            milliseconds
            date
            strikethrough
            is_visible
          }
        }
      `,
      variables: {
        id: task.id,
        _set: {
          category_id: task.category_id,
          user_id: task.user_id,
          description: task.description,
          emoji: task.emoji,
          milliseconds: task.milliseconds,
          date: task.date,
          strikethrough: task.strikethrough,
          is_visible: task.is_visible,
        },
      },
    }),
  });

  const result = await response.json();

  return result.data.update_tasks_by_pk;
};

const deleteTask = async (task: Partial<Task>): Promise<Task> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation delete_single_task($id: uuid!) {
          delete_tasks_by_pk(id: $id) {
            id
          }
        }
      `,
      variables: {
        id: task.id,
      },
    }),
  });

  const result = await response.json();

  return result.data.delete_tasks_by_pk;
};

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
          query get_categories {
            categories {
              id
              name
              color
            }
          }
        `,
    }),
  });

  const result = await response.json();
  return result.data.categories;
};

const createCategory = async (
  category: Partial<Category>
): Promise<Category> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation insert_single_category($name: String!, $color: String!) {
          insert_categories_one(object: {name: $name, color: $color}) {
            id
            name
            color
          }
        }
      `,
      variables: {
        name: category.name,
        color: category.color,
      },
    }),
  });

  const result = await response.json();

  return result.data.insert_categories_one;
};

const deleteCategory = async (
  category: Partial<Category>
): Promise<Category> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation delete_single_category($id: uuid!) {
          delete_categories_by_pk(id: $id) {
            id
            name
            color
          }
        }
      `,
      variables: {
        id: category.id,
      },
    }),
  });

  const result = await response.json();

  return result.data.delete_categories_by_pk;
};

const createUser = async (): Promise<User> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation insert_single_user {
          insert_users_one(object: {}) {
            id
          }
        }
      `,
      variables: {},
    }),
  });

  const result = await response.json();

  return result.data.insert_users_one;
};

const fetchSession = async (user_id: string): Promise<Session> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
          query get_session($user_id: uuid!) {
            session(limit: 1, where: {user_id: {_eq: $user_id}}) {
              id
              start_time
              task_in_process
              end_of_day
              user_id
            }
          }
        `,
      variables: {
        user_id,
      },
    }),
  });

  const result = await response.json();
  return result.data.session[0];
};

const createSession = async (session: Partial<Session>): Promise<Session> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation insert_single_session($object: session_insert_input!) {
          insert_session_one(object: $object) {
            end_of_day
            id
            start_time
            task_in_process
            user_id
          }
        }
      `,
      variables: {
        object: {
          start_time: session.start_time,
          end_of_day: session.end_of_day,
          task_in_process: session.task_in_process || null,
          user_id: session.user_id || null,
        },
      },
    }),
  });

  const result = await response.json();

  return result.data.insert_session_one;
};

const updateSession = async (session: Partial<Session>): Promise<Session> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `
        mutation update_single_session($id: uuid!, $start_time: bigint, $end_of_day: bigint, $task_in_process: jsonb = null) {
          update_session_by_pk(pk_columns: {id: $id}, _set: {start_time: $start_time, end_of_day: $end_of_day, task_in_process: $task_in_process}) {
            id
            end_of_day 
            start_time
            task_in_process
          }
        }
      `,
      variables: {
        id: session.id,
        start_time: session.start_time,
        end_of_day: session.end_of_day,
        task_in_process: session.task_in_process || null,
      },
    }),
  });

  const result = await response.json();

  return result.data.update_session_by_pk;
};

export {
  fetchCategories,
  createCategory,
  deleteCategory,
  fetchTasks,
  createTask,
  findTask,
  updateTask,
  deleteTask,
  createUser,
  fetchSession,
  createSession,
  updateSession,
};
