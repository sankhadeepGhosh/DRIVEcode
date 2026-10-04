"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// Type definitions
export interface Subtask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tools?: string[]; // Optional array of MCP server tools
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  level: number;
  dependencies: string[];
  subtasks: Subtask[];
}

export interface PlanProps {
  initialTasks?: Task[];
  onTasksChange?: (tasks: Task[]) => void;
  title?: string;
  className?: string;
}

// Initial task data
export const initialTasks: Task[] = [
  {
    id: "1",
    title: "Analyze Requirements & Architecture",
    description: "Extract specifications from user prompt, formulate component layout, and configure design tokens.",
    status: "completed",
    priority: "high",
    level: 0,
    dependencies: [],
    subtasks: [
      {
        id: "1.1",
        title: "Parse user specifications & layout requirements",
        description: "Extracted intent, functional requirements, and structured component boundaries.",
        status: "completed",
        priority: "high",
      },
      {
        id: "1.2",
        title: "Initialize design tokens & typography scale",
        description: "Configured Tailwind CSS utility palette, fluid typography, and responsive spacing scale.",
        status: "completed",
        priority: "medium",
      },
    ],
  },
  {
    id: "2",
    title: "Synthesize Semantic HTML5 Structure",
    description: "Construct accessible DOM tree, responsive viewport meta, and semantic page regions.",
    status: "completed",
    priority: "high",
    level: 0,
    dependencies: ["1"],
    subtasks: [
      {
        id: "2.1",
        title: "Scaffold document head, viewport meta & CDN resources",
        description: "Configured UTF-8 charset, responsive mobile viewport, Google Fonts CDN, and Tailwind CDN.",
        status: "completed",
        priority: "high",
      },
      {
        id: "2.2",
        title: "Construct semantic layout & accessible content regions",
        description: "Built accessible semantic landmarks (<nav>, <main>, <section>, <footer>) and responsive grid wrappers.",
        status: "completed",
        priority: "high",
      },
    ],
  },
  {
    id: "3",
    title: "Apply Modern Tailwind Styling & Visual Hierarchy",
    description: "Incorporate mobile-first utility classes, fluid spacing, visual accents, and responsive layout hierarchy.",
    status: "completed",
    priority: "high",
    level: 1,
    dependencies: ["2"],
    subtasks: [
      {
        id: "3.1",
        title: "Configure responsive utility classes & fluid typography",
        description: "Applied mobile (sm: 640px), tablet (md: 768px), and desktop (lg: 1024px) responsive breakpoints.",
        status: "completed",
        priority: "high",
      },
      {
        id: "3.2",
        title: "Apply visual accents, shadows & vector icons",
        description: "Injected gradient overlays, subtle shadows, clean borders, and Lucide vector icons.",
        status: "completed",
        priority: "medium",
      },
    ],
  },
  {
    id: "4",
    title: "Inject Client-Side Interactivity & State Handlers",
    description: "Attach vanilla JavaScript logic for dynamic user interactions, button events, state toggles, and form controls.",
    status: "completed",
    priority: "medium",
    level: 1,
    dependencies: ["3"],
    subtasks: [
      {
        id: "4.1",
        title: "Initialize interactive event listeners & UI bindings",
        description: "Bound DOM event listeners via addEventListener for keyboard and touch-accessible interactions.",
        status: "completed",
        priority: "high",
      },
      {
        id: "4.2",
        title: "Initialize state handlers & Lucide icon runtime",
        description: "Verified client-side state transitions and invoked lucide.createIcons() to render dynamic vector icons.",
        status: "completed",
        priority: "medium",
      },
    ],
  },
  {
    id: "5",
    title: "Mount Sandboxed Live Preview & Runtime Verification",
    description: "Bundle complete index.html into isolated iframe sandbox and verify live execution.",
    status: "completed",
    priority: "high",
    level: 1,
    dependencies: ["4"],
    subtasks: [
      {
        id: "5.1",
        title: "Bundle & mount index.html into isolated iframe sandbox",
        description: "Injected complete HTML5 payload with Tailwind styles and scripts into sandboxed iframe runtime.",
        status: "completed",
        priority: "high",
      },
      {
        id: "5.2",
        title: "Verify zero console errors & validate rendering",
        description: "Validated clean runtime execution with zero syntax errors. Mounted live interactive preview.",
        status: "completed",
        priority: "medium",
      },
    ],
  },
];

export default function Plan({
  initialTasks: propTasks,
  onTasksChange,
  className = "",
}: PlanProps = {}) {
  const [tasks, setTasks] = useState<Task[]>(propTasks || initialTasks);
  const [expandedTasks, setExpandedTasks] = useState<string[]>(() => {
    const list = propTasks || initialTasks;
    return list.map((t) => t.id);
  });
  const [expandedSubtasks, setExpandedSubtasks] = useState<{
    [key: string]: boolean;
  }>({});

  // Sync internal tasks state when propTasks change (e.g. during streaming)
  React.useEffect(() => {
    if (propTasks && propTasks.length > 0) {
      setTasks(propTasks);

      // Auto-expand only active/in-progress tasks to keep UI clean and responsive on mobile
      const activeTasks = propTasks.filter(
        (t) => t.status === "in-progress" || t.status === "need-help"
      );
      if (activeTasks.length > 0) {
        setExpandedTasks(activeTasks.map((t) => t.id));
      } else {
        setExpandedTasks((prev) => (prev.length > 0 ? prev : [propTasks[0].id]));
      }
    }
  }, [propTasks]);
  // Add support for reduced motion preference
  const prefersReducedMotion = 
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  // Toggle subtask expansion
  const toggleSubtaskExpansion = (taskId: string, subtaskId: string) => {
    const key = `${taskId}-${subtaskId}`;
    setExpandedSubtasks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle task status
  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) => {
      const updated = prev.map((task) => {
        if (task.id === taskId) {
          // Toggle the status
          const statuses = ["completed", "in-progress", "pending", "need-help", "failed"];
          const currentIndex = Math.floor(Math.random() * statuses.length);
          const newStatus = statuses[currentIndex];

          // If task is now completed, mark all subtasks as completed
          const updatedSubtasks = task.subtasks.map((subtask) => ({
            ...subtask,
            status: newStatus === "completed" ? "completed" : subtask.status,
          }));

          return {
            ...task,
            status: newStatus,
            subtasks: updatedSubtasks,
          };
        }
        return task;
      });
      onTasksChange?.(updated);
      return updated;
    });
  };

  // Toggle subtask status
  const toggleSubtaskStatus = (taskId: string, subtaskId: string) => {
    setTasks((prev) => {
      const updated = prev.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map((subtask) => {
            if (subtask.id === subtaskId) {
              const newStatus =
                subtask.status === "completed" ? "pending" : "completed";
              return { ...subtask, status: newStatus };
            }
            return subtask;
          });

          // Calculate if task should be auto-completed when all subtasks are done
          const allSubtasksCompleted = updatedSubtasks.every(
            (s) => s.status === "completed",
          );

          return {
            ...task,
            subtasks: updatedSubtasks,
            status: allSubtasksCompleted ? "completed" : task.status,
          };
        }
        return task;
      });
      onTasksChange?.(updated);
      return updated;
    });
  };

  // Animation variants with reduced motion support
  const taskVariants = {
    hidden: { 
      opacity: 0, 
      y: prefersReducedMotion ? 0 : -5 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: prefersReducedMotion
        ? { type: "tween" as const, duration: 0.2 }
        : { type: "spring" as const, stiffness: 500, damping: 30 }
    },
    exit: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -5,
      transition: { duration: 0.15 }
    }
  };

  const subtaskListVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      overflow: "hidden" as const
    },
    visible: { 
      height: "auto" as const, 
      opacity: 1,
      overflow: "visible" as const,
      transition: { 
        duration: 0.25, 
        staggerChildren: prefersReducedMotion ? 0 : 0.05,
        when: "beforeChildren" as const,
        ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number]
      }
    },
    exit: {
      height: 0,
      opacity: 0,
      overflow: "hidden" as const,
      transition: { 
        duration: 0.2,
        ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number]
      }
    }
  };

  const subtaskVariants = {
    hidden: { 
      opacity: 0, 
      x: prefersReducedMotion ? 0 : -10 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: prefersReducedMotion
        ? { type: "tween" as const, duration: 0.2 }
        : { type: "spring" as const, stiffness: 500, damping: 25 }
    },
    exit: {
      opacity: 0,
      x: prefersReducedMotion ? 0 : -10,
      transition: { duration: 0.15 }
    }
  };

  const subtaskDetailsVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      overflow: "hidden" as const
    },
    visible: { 
      opacity: 1, 
      height: "auto" as const,
      overflow: "visible" as const,
      transition: { 
        duration: 0.25,
        ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number]
      }
    }
  };

  // Status badge animation variants
  const statusBadgeVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: prefersReducedMotion ? 1 : [1, 1.08, 1],
      transition: { 
        duration: 0.35,
        ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number]
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <motion.div 
        className={`rounded-xl overflow-hidden ${
          className.includes('border-none')
            ? 'bg-transparent'
            : 'bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-neutral-800 shadow-xs'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.3,
            ease: [0.2, 0.65, 0.3, 0.9]
          }
        }}
      >
        <LayoutGroup>
          <div className="p-4 overflow-hidden">
            <ul className="space-y-1 overflow-hidden">
              {tasks.map((task, index) => {
                const isExpanded = expandedTasks.includes(task.id);
                const isCompleted = task.status === "completed";

                return (
                  <motion.li
                    key={task.id}
                    className={` ${index !== 0 ? "mt-1 pt-2" : ""} `}
                    initial="hidden"
                    animate="visible"
                    variants={taskVariants}
                  >
                    {/* Task row */}
                    <motion.div 
                      className="group flex items-center px-3 py-1.5 rounded-md"
                      whileHover={{ 
                        backgroundColor: "rgba(0,0,0,0.03)",
                        transition: { duration: 0.2 }
                      }}
                    >
                      <motion.div
                        className="mr-2 flex-shrink-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskStatus(task.id);
                        }}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={task.status}
                            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                            transition={{
                              duration: 0.2,
                              ease: [0.2, 0.65, 0.3, 0.9]
                            }}
                          >
                            {task.status === "completed" ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
                            ) : task.status === "in-progress" ? (
                              <CircleDotDashed className="h-4.5 w-4.5 text-blue-500" />
                            ) : task.status === "need-help" ? (
                              <CircleAlert className="h-4.5 w-4.5 text-yellow-500" />
                            ) : task.status === "failed" ? (
                              <CircleX className="h-4.5 w-4.5 text-red-500" />
                            ) : (
                              <Circle className="text-neutral-400 dark:text-neutral-500 h-4.5 w-4.5" />
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </motion.div>

                      <motion.div
                        className="flex min-w-0 flex-grow cursor-pointer items-center justify-between"
                        onClick={() => toggleTaskExpansion(task.id)}
                      >
                        <div className="mr-2 flex-1 min-w-0">
                          <span
                            className={`text-xs sm:text-sm font-semibold tracking-tight leading-snug break-words ${
                              isCompleted
                                ? "text-neutral-400 dark:text-neutral-500 line-through font-normal"
                                : "text-neutral-900 dark:text-neutral-100"
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div className="flex flex-shrink-0 items-center space-x-1.5 sm:space-x-2 text-xs">
                          {task.dependencies.length > 0 && (
                            <div className="hidden sm:flex items-center mr-1">
                              <div className="flex flex-wrap gap-1">
                                {task.dependencies.map((dep, idx) => (
                                  <motion.span
                                    key={idx}
                                    className="bg-secondary/40 text-secondary-foreground rounded px-1.5 py-0.5 text-[10px] font-medium shadow-sm"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                      duration: 0.2,
                                      delay: idx * 0.05
                                    }}
                                    whileHover={{ 
                                      y: -1, 
                                      backgroundColor: "rgba(0,0,0,0.1)",
                                      transition: { duration: 0.2 } 
                                    }}
                                  >
                                    {dep}
                                  </motion.span>
                                ))}
                              </div>
                            </div>
                          )}

                          <motion.span
                            className={`rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-medium capitalize ${
                              task.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400 border border-green-200/60 dark:border-green-800/40"
                                : task.status === "in-progress"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40"
                                  : task.status === "need-help"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400 border border-yellow-200/60 dark:border-yellow-800/40"
                                    : task.status === "failed"
                                      ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200/60 dark:border-red-800/40"
                                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                            }`}
                            variants={statusBadgeVariants}
                            initial="initial"
                            animate="animate"
                            key={task.status} // Force animation on status change
                          >
                            {task.status}
                          </motion.span>
                        </div>
                      </motion.div>
                    </motion.div>

                    {/* Subtasks - staggered */}
                    <AnimatePresence mode="wait">
                      {isExpanded && task.subtasks.length > 0 && (
                        <motion.div 
                          className="relative overflow-hidden"
                          variants={subtaskListVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          layout
                        >
                          {/* Vertical connecting line aligned with task icon */}
                          <div className="absolute top-0 bottom-0 left-[20px] border-l-2 border-dashed border-neutral-300 dark:border-neutral-700" />
                          <ul className="border-muted mt-1 mr-2 mb-1.5 ml-3 space-y-0.5">
                            {task.subtasks.map((subtask) => {
                              const subtaskKey = `${task.id}-${subtask.id}`;
                              const isSubtaskExpanded = expandedSubtasks[subtaskKey];

                              return (
                                <motion.li
                                  key={subtask.id}
                                  className="group flex flex-col py-0.5 pl-6"
                                  onClick={() =>
                                    toggleSubtaskExpansion(task.id, subtask.id)
                                  }
                                  variants={subtaskVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  layout
                                >
                                  <motion.div 
                                    className="flex flex-1 items-center rounded-md p-1"
                                    whileHover={{ 
                                      backgroundColor: "rgba(0,0,0,0.03)",
                                      transition: { duration: 0.2 }
                                    }}
                                    layout
                                  >
                                    <motion.div
                                      className="mr-2 flex-shrink-0 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSubtaskStatus(task.id, subtask.id);
                                      }}
                                      whileTap={{ scale: 0.9 }}
                                      whileHover={{ scale: 1.1 }}
                                      layout
                                    >
                                      <AnimatePresence mode="wait">
                                        <motion.div
                                          key={subtask.status}
                                          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                          exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                                          transition={{
                                            duration: 0.2,
                                            ease: [0.2, 0.65, 0.3, 0.9]
                                          }}
                                        >
                                          {subtask.status === "completed" ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                          ) : subtask.status === "in-progress" ? (
                                            <CircleDotDashed className="h-3.5 w-3.5 text-blue-500" />
                                          ) : subtask.status === "need-help" ? (
                                            <CircleAlert className="h-3.5 w-3.5 text-yellow-500" />
                                          ) : subtask.status === "failed" ? (
                                            <CircleX className="h-3.5 w-3.5 text-red-500" />
                                          ) : (
                                            <Circle className="text-neutral-400 dark:text-neutral-500 h-3.5 w-3.5" />
                                          )}
                                        </motion.div>
                                      </AnimatePresence>
                                    </motion.div>

                                    <span
                                      className={`cursor-pointer text-xs sm:text-sm font-medium leading-snug break-words flex-1 min-w-0 ${
                                        subtask.status === "completed"
                                          ? "text-neutral-400 dark:text-neutral-500 line-through font-normal"
                                          : "text-neutral-900 dark:text-neutral-100"
                                      }`}
                                    >
                                      {subtask.title}
                                    </span>
                                  </motion.div>

                                  <AnimatePresence mode="wait">
                                    {isSubtaskExpanded && (
                                      <motion.div 
                                        className="text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700 mt-1 ml-1.5 border-l border-dashed pl-5 text-xs overflow-hidden"
                                        variants={subtaskDetailsVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        layout
                                      >
                                        <p className="py-1">{subtask.description}</p>
                                        {subtask.tools && subtask.tools.length > 0 && (
                                          <div className="mt-0.5 mb-1 flex flex-wrap items-center gap-1.5">
                                            <span className="text-neutral-600 dark:text-neutral-400 font-medium text-[11px]">
                                              MCP Servers:
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                              {subtask.tools.map((tool, idx) => (
                                                <motion.span
                                                  key={idx}
                                                  className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded px-1.5 py-0.5 text-[10px] font-medium shadow-xs"
                                                  initial={{ opacity: 0, y: -5 }}
                                                  animate={{ 
                                                    opacity: 1, 
                                                    y: 0,
                                                    transition: {
                                                      duration: 0.2,
                                                      delay: idx * 0.05
                                                    }
                                                  }}
                                                  whileHover={{ 
                                                    y: -1, 
                                                    backgroundColor: "rgba(0,0,0,0.1)",
                                                    transition: { duration: 0.2 } 
                                                  }}
                                                >
                                                  {tool}
                                                </motion.span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
