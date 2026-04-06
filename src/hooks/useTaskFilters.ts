import { useState, useMemo } from 'react';
import { CRMActivitiesTable } from '@/types/tables/crm.types';

type Task = CRMActivitiesTable['Row'] & {
  contactName?: string | null;
};

export const useTaskFilters = (tasks: Task[]) => {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = search === "" || 
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase()) ||
        task.contactName?.toLowerCase().includes(search.toLowerCase());

      const matchesPriority = priorityFilter === "" || 
        task.type.toLowerCase() === priorityFilter.toLowerCase();

      return matchesSearch && matchesPriority;
    });
  }, [tasks, search, priorityFilter]);

  return {
    search,
    setSearch,
    priorityFilter,
    setPriorityFilter,
    filteredTasks
  };
};