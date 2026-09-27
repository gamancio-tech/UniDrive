import { prisma } from "../lib/prisma";


export const adminRepository = {
  async createAdmin (name: string, email: string, passwordHash: string){
    return prisma.admin.create({
      data: {
        name,
        email,
        passwordHash
      }
    });
  },
  async findByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email } });
  }
}
