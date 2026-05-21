import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../api/projectApi.js";

export function useProjectsQuery() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }) => updateProject(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });
}
