import {
  createMachine
} from "xstate";

export const projectMachine =
  createMachine({

    id: "project",

    initial: "idle",

    states: {

      idle: {
        on: {
          START: "running",
        },
      },

      running: {
        on: {
          COMPLETE:
            "completed",
        },
      },

      completed: {},
    },

  });
