import {
  useTimerStore,
  useUserStore,
  getCurrentDate,
  stopTimer,
} from "@/store/index.store";
import { Check, Eraser, Pencil, Play, Plus, Trash2 } from "lucide-react";

import { useEffect, useState } from "react";
import { ChartLineMultiple } from "@/components/ChartLine";
import { Category, Task, Session as TaskSession } from "@/lib/types";

import {
  createCategory,
  createTask,
  deleteCategory,
  deleteTask,
  fetchCategories,
  fetchSession,
  fetchTasks,
  updateTask,
} from "@/services/tasks-graphql";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { emojis } from "@/lib/data";

function Tasks() {
  const [taskSelected, setTaskSelected] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categoryToCreate, setCategoryToCreate] = useState<Partial<Category>>({
    name: "",
    color: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [openOldTaskDialog, setOpenOldTaskDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [openUpdateTaskDialog, setOpenUpdateTaskDialog] = useState(false);
  const [taskSelectedToUpdate, setTaskSelectedToUpdate] =
    useState<Task | null>();
  const [session, setSession] = useState<TaskSession>();
  const [taskToCreate, setTaskToCreate] = useState<Partial<Task>>({
    description: "",
    emoji: "",
    category_id: "",
  });

  const { startTime, endOfDay, taskInProcess, startTimer } = useTimerStore();
  const { userId } = useUserStore();
  const { currentDate } = getCurrentDate();

  const groupedTasksByCategory = () => {
    const grouped = tasks.reduce<Record<string, Record<string, number>>>(
      (acc, task) => {
        const { date, category, milliseconds } = task;

        if (!acc[date]) {
          acc[date] = {};
        }
        acc[date][category.name] = Number(
          (
            (acc[date][category.name] || 0) +
            milliseconds / (1000 * 60 * 60)
          ).toFixed(2)
        );

        return acc;
      },
      {}
    );

    // Convert to desired array format
    const categories = [...new Set(tasks.map((task) => task.category.name))];
    return Object.entries(grouped).map(([date, categoryTotals]) => {
      const row: { date: string; [key: string]: string | number } = { date };
      categories.forEach((cat) => {
        row[cat] = categoryTotals[cat] || 0;
      });
      return row;
    });
  };

  const handleTaskSelected = (task: Task) => {
    if (!task || taskSelected?.id === task.id) return;

    if (taskSelected?.id !== task.id && startTime && taskSelected) {
      const newTaskMs = Date.now() - startTime;

      const taskToUpdate: Task = {
        id: taskSelected.id,
        category_id: taskSelected.category_id,
        user_id: taskSelected.user_id,
        category: taskSelected.category,
        description: taskSelected.description,
        emoji: taskSelected.emoji,
        milliseconds: newTaskMs,
        date: taskSelected.date,
        strikethrough: taskSelected.strikethrough,
        is_visible: taskSelected.is_visible,
      };

      handleUpdateTask(taskToUpdate);
    }

    startTimer(task, true);
    setTaskSelected(task);
  };

  const handleCloneTask = async (task: Task) => {
    if (!userId || !task || task.date === currentDate) return;

    const taskToUpdate: Partial<Task> = {
      id: task.id,
      milliseconds: task.milliseconds,
      is_visible: false,
    };

    updateTask(taskToUpdate);

    const newTask: Partial<Task> = {
      user_id: task.user_id,
      category_id: task.category_id,
      description: task.description,
      emoji: task.emoji,
      milliseconds: 0,
      is_visible: true,
    };

    createTask(newTask);
  };

  const strikeTroughTask = async (task: Task) => {
    if (!userId || !task) return;

    const taskToUpdate: Partial<Task> = {
      id: task.id,
      strikethrough: !task.strikethrough,
    };

    updateTask(taskToUpdate).then(() =>
      setTasks((prevTasks) => {
        const updatedTasks = prevTasks
          .sort((a, b) => b.milliseconds - a.milliseconds)
          .map((prevTask) =>
            prevTask.id === task.id
              ? { ...prevTask, strikethrough: !task.strikethrough }
              : prevTask
          );
        return updatedTasks;
      })
    );
  };

  const handleAddTask = async () => {
    if (!userId || !taskToCreate) return;

    const newTask: Partial<Task> = {
      user_id: userId,
      category_id: taskToCreate?.category_id,
      description: taskToCreate?.description,
      emoji: taskToCreate?.emoji,
      milliseconds: 0,
    };

    createTask(newTask).then(() => fetchTasks(userId).then(setTasks));
  };

  const handleUpdateTask = async (taskToUpdate: Task) => {
    if (!taskToUpdate || !userId) return;

    updateTask(taskToUpdate).then(() => fetchTasks(userId).then(setTasks));
  };

  const handleDeleteTask = async (task: Task) => {
    if (!task || !userId) return;

    deleteTask(task).then(() => fetchTasks(userId).then(setTasks));
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!category || !userId) return;

    deleteCategory(category).then(() =>
      setCategories((prevCategories) =>
        prevCategories.filter((c) => c.id !== category.id)
      )
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleAddTask();
  };

  const calculateTaskTime = (task: Task) => {
    const msAccumulated = task.milliseconds;

    const totalMinutes = Math.floor(msAccumulated / (1000 * 60)); // → 5 minutos
    const hours = Math.floor(totalMinutes / 60); // → 0
    const minutes = totalMinutes % 60; // → 5

    return `${hours.toString().padStart(2, "0")}hr ${minutes
      .toString()
      .padStart(2, "0")}min`;
  };

  const handleAddCategory = async () => {
    if (!categoryToCreate) return;

    const newCategory: Partial<Category> = {
      name: categoryToCreate.name,
      color: categoryToCreate.color,
    };

    createCategory(newCategory).then((categoryAdded) => {
      setCategories((prevCategories) => [
        ...prevCategories,
        {
          id: categoryAdded.id,
          name: categoryAdded.name,
          color: categoryAdded.color,
        },
      ]);

      setTaskToCreate((prev) =>
        prev ? { ...prev, category_id: categoryAdded.id } : prev
      );
    });

    setCategoryToCreate({ name: "", color: "" });
  };

  const getCategoriesWithHours = (): Category[] => {
    if (!tasks || tasks.length === 0) return [];

    const categoriesWithHours = tasks.reduce<Record<string, number>>(
      (acc, task) => {
        const { category, milliseconds } = task;

        if (!acc[category.name]) {
          acc[category.name] = 0;
        }

        acc[category.name] = (Number(acc[category.name]) || 0) + milliseconds;

        return acc;
      },
      {}
    );

    return Object.entries(categoriesWithHours).map(([category, totalHours]) => {
      const row = {
        id: categories.find((c) => c.name === category)?.id || "",
        name:
          category +
          ` (${Math.floor(totalHours / (1000 * 60 * 60))
            .toString()
            .padStart(2, "0")}:${Math.floor(
            (totalHours % (1000 * 60 * 60)) / (1000 * 60)
          )
            .toString()
            .padStart(2, "0")})`,
        color: categories.find((c) => c.name === category)?.color || "",
      };

      return row;
    });
  };

  const updateOldTask = () => {
    if (!session || !session.start_time) return;

    const taskToUpdate: Partial<Task> = {
      id: session.task_in_process?.id,
      milliseconds: Date.now() - session.start_time,
    };

    updateTask(taskToUpdate).then(() => {
      setOpenOldTaskDialog(false);
    });

    setTimeout(() => {
      stopTimer();
    }, 1000);
  };

  useEffect(() => {
    if (!taskSelectedToUpdate) return;

    setOpenUpdateTaskDialog(true);
  }, [taskSelectedToUpdate]);

  useEffect(() => {
    if (taskToCreate && taskToCreate.category_id === "new") {
      setOpenCategoryDialog(true);
    }
  }, [taskToCreate]);

  useEffect(() => {
    if (!taskInProcess) return;

    setTaskSelected(taskInProcess ?? null);
    console.log(startTime);

    if (taskInProcess.date !== currentDate) {
      if (!endOfDay || !startTime || !userId) return;

      if (Date.now() > startTime) {
        setOpenOldTaskDialog(true);
      }
    }
  }, [taskInProcess]);

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    tasks
      .filter((task) => task.is_visible)
      .forEach((task) => {
        // Handle tasks that are not from the current date
        handleCloneTask(task);
      });
  }, [tasks]);

  useEffect(() => {
    if (!userId) return;

    fetchSession(userId).then((session) => {
      if (session && session.task_in_process) {
        setTaskSelected(session.task_in_process);
        startTimer(session.task_in_process, false);
        setSession(session);
      }
    });

    fetchTasks(userId).then(setTasks);
    fetchCategories().then(setCategories);
  }, []);

  return (
    <>
      <div className="mx-auto md:grid grid-cols-2 gap-4">
        <div className="from-white/20 to-transparent bg-gradient-to-b p-4 rounded-2xl shadow-md border-x border-t border-gray-400 z-[6] relative mb-4">
          <ChartLineMultiple
            chartData={groupedTasksByCategory()}
            categories={categories}
            chartLegend={getCategoriesWithHours()}
          />
        </div>

        <div>
          <ul className="space-y-2">
            {tasks &&
              tasks
                .filter((task) => task.is_visible)
                .sort(
                  (a, b) => Number(a.strikethrough) - Number(b.strikethrough)
                )
                .map((task) => (
                  <li
                    key={task.id}
                    className={`relative text-black mb-4 rounded-lg flex items-center ${
                      taskSelected?.id === task.id &&
                      "border-amber-400 border animate-pulse"
                    } w-full p-4`}
                    style={{
                      backgroundColor: task.category.color
                        ? `${task.category.color.replace(
                            /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,
                            (_, r, g, b) =>
                              `rgba(${parseInt(r, 16)},${parseInt(
                                g,
                                16
                              )},${parseInt(b, 16)},0.3)`
                          )}`
                        : "",
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <img
                          src={`/daily-tasks-app${task.emoji}`}
                          width="22"
                          alt="Emoji"
                        />
                        <strong
                          className={`max-xl:text-xs ${
                            task.strikethrough ? "line-through" : ""
                          }`}
                        >
                          {task.description}
                        </strong>
                      </div>

                      <span className={`text-xs block`}>
                        {calculateTaskTime(task) || "00hr 00min"}
                      </span>
                    </div>

                    <div className="flex justify-center items-center gap-2">
                      {taskSelected?.id !== task.id && (
                        <>
                          <button
                            onClick={() => strikeTroughTask(task)}
                            className={`group hover:scale-120 transition-all duration-200 rounded-lg mr-2 size-5 flex items-center justify-center ${
                              task.strikethrough
                                ? "bg-green-500"
                                : "bg-slate-300"
                            } text-white`}
                          >
                            <Check
                              size={16}
                              className={`${
                                !task.strikethrough && "hidden"
                              } group-hover:block`}
                            />
                            {""}
                          </button>

                          <button
                            className={`hover:scale-120 transition-all duration-200 mr-2 ${
                              currentDate !== task.date ? "opacity-50" : ""
                            }`}
                            style={{
                              borderColor: task.category.color || "#fbbf24",
                            }}
                            onClick={() => handleTaskSelected(task)}
                            disabled={taskSelected?.id === task.id}
                          >
                            <Play size={16} />
                            {""}
                          </button>

                          <button
                            onClick={() => setTaskSelectedToUpdate(task)}
                            className="hover:scale-120 transition-all duration-200 mr-2"
                          >
                            <Pencil size={16} />
                            {""}
                          </button>
                          <span className="text-gray-500 translate-y-0.5 select-none">
                            |
                          </span>
                          <button
                            onClick={() => handleDeleteTask(task)}
                            type="button"
                            className="hover:scale-120 transition-all duration-200 ml-2"
                          >
                            <Eraser size={16} />
                            {""}
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
          </ul>

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="text-xs grid grid-cols-3 gap-2">
              <Input
                className="!bg-white !text-black w-full text-xs"
                type="text"
                name="title"
                placeholder="Task title"
                autoComplete="off"
                onChange={(e) =>
                  setTaskToCreate((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev
                  )
                }
                value={taskToCreate?.description}
              />

              <Select
                onValueChange={(value) => {
                  setTaskToCreate((prev) =>
                    prev ? { ...prev, emoji: value } : prev
                  );
                }}
                value={taskToCreate?.emoji}
              >
                <SelectTrigger
                  className="!bg-white !text-black w-full text-xs"
                  aria-label="Select an emoji"
                >
                  <SelectValue placeholder="Emoji" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {emojis.map((emoji) => (
                    <SelectItem value={emoji} key={emoji}>
                      <img
                        src={`/daily-tasks-app${emoji}`}
                        width="22"
                        alt="Emoji"
                      />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) => {
                  setTaskToCreate((prev) =>
                    prev ? { ...prev, category_id: value } : prev
                  );
                }}
                value={taskToCreate?.category_id}
              >
                <SelectTrigger
                  className="!bg-white !text-black w-full text-xs"
                  aria-label="Select a category"
                >
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((category) => (
                    <SelectItem value={category.id} key={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}

                  <SelectItem value="new">New category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="rounded-full fixed right-4 bottom-5 size-14"
              type="submit"
              disabled={
                !taskToCreate?.description ||
                !taskToCreate?.category_id ||
                !taskToCreate?.emoji
              }
            >
              <Plus />
            </Button>
          </form>
        </div>
      </div>

      <AlertDialog open={openOldTaskDialog} onOpenChange={setOpenOldTaskDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Old task selected</AlertDialogTitle>
            <AlertDialogDescription>
              There is an old task selected from a previous date. You can update
              the task with the current time.
            </AlertDialogDescription>

            <div className="flex items-center justify-center gap-2"></div>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex items-center gap-4">
            <AlertDialogAction
              onClick={updateOldTask}
              disabled={currentDate === taskSelected?.date}
            >
              Update old task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={openCategoryDialog}
        onOpenChange={setOpenCategoryDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create a category</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for the new category that will help you organize your
              tasks.
            </AlertDialogDescription>
            <ul className="text-xs">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-2 space-y-2"
                >
                  <span>{category.name}</span>

                  <button onClick={() => handleDeleteCategory(category)}>
                    <Trash2 size={14} />
                    {""}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center gap-2">
              <Input
                placeholder="Enter a category name"
                onChange={(e) =>
                  setCategoryToCreate((prev) =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
              />

              <Input
                type="color"
                onChange={(e) =>
                  setCategoryToCreate((prev) =>
                    prev ? { ...prev, color: e.target.value } : prev
                  )
                }
              />
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex items-center gap-4">
            <AlertDialogCancel
              onClick={() =>
                setTaskToCreate((prev) =>
                  prev ? { ...prev, category_id: "" } : prev
                )
              }
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleAddCategory}
              disabled={!categoryToCreate.name || !categoryToCreate.color}
            >
              Create category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={openUpdateTaskDialog}
        onOpenChange={setOpenUpdateTaskDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update task</AlertDialogTitle>
            <AlertDialogDescription>
              Update the task details below to modify this task.
            </AlertDialogDescription>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Enter task description"
                type="text"
                value={taskSelectedToUpdate?.description}
                onChange={(e) =>
                  setTaskSelectedToUpdate((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev
                  )
                }
              />

              <Select
                onValueChange={(value) => {
                  setTaskSelectedToUpdate((prev) =>
                    prev ? { ...prev, emoji: value } : prev
                  );
                }}
                value={taskSelectedToUpdate?.emoji || ""}
              >
                <SelectTrigger
                  className="!bg-white !text-black w-full"
                  aria-label="Select an emoji"
                >
                  <SelectValue placeholder="Emoji" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {emojis.map((emoji) => (
                    <SelectItem value={emoji} key={emoji}>
                      <img
                        src={`/daily-tasks-app${emoji}`}
                        width="22"
                        alt="Emoji"
                      />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Minutes"
                type="number"
                min={0}
                value={
                  taskSelectedToUpdate
                    ? (taskSelectedToUpdate.milliseconds / 1000 / 60).toFixed(0)
                    : 0
                }
                onChange={(e) =>
                  setTaskSelectedToUpdate((prev) =>
                    prev
                      ? {
                          ...prev,
                          milliseconds: Number(e.target.value) * 1000 * 60,
                        }
                      : prev
                  )
                }
              />
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex items-center gap-4">
            <AlertDialogCancel onClick={() => setTaskSelectedToUpdate(null)}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                taskSelectedToUpdate && handleUpdateTask(taskSelectedToUpdate);
              }}
            >
              Update task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default Tasks;
