export interface Course {
  id: string;
  name: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  resourceIds: string[];
}

export interface CoursesStore {
  courses: Course[];
}

export interface CourseWithResources extends Course {
  resources: import('./resource-types').Resource[];
}
