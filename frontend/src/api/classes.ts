import { apiRequest } from "./client";

export interface DriverClass {
  id: string;
  name: string;
  createdAt: string;
  studentCount?: number;
}

export async function getDriverClasses(): Promise<DriverClass[]> {
  return apiRequest<DriverClass[]>("/classes");
}

export async function createDriverClass(name: string): Promise<DriverClass> {
  return apiRequest<DriverClass>("/classes", {
    method: "POST",
    body: { name },
  });
}

export async function updateDriverClass(id: string, name: string): Promise<DriverClass> {
  return apiRequest<DriverClass>(`/classes/${id}`, {
    method: "PUT",
    body: { name },
  });
}

export async function deleteDriverClass(id: string): Promise<void> {
  return apiRequest<void>(`/classes/${id}`, {
    method: "DELETE",
  });
}
