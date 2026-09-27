import { AppError } from "../middlewares/errorHandler.middleware";
import { driverRepository } from "../repositories/driver.repository";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const driverService = {

  async create(name: string, email: string, password: string, pixKey?: string) {
    const existing = await driverRepository.findByEmail(email);
    if (existing) {
      throw new AppError("Já existe um motorista cadastrado com este e-mail.", StatusCodeHttp.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const driver = await driverRepository.create({ name, email, passwordHash, pixKey });
    
    return driver;
  },

  async getAllDrivers() {
    const drivers = await driverRepository.findAll();
    return drivers;
  },

  async findById(id: string) {
    const driver = await driverRepository.findById(id);
    if (!driver) {
      throw new AppError("Motorista não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    return driver;
  }
}