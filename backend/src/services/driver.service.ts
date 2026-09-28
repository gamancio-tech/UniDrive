import { AppError } from "../middlewares/errorHandler.middleware";
import { driverRepository } from "../repositories/driver.repository";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const driverService = {

  async create(name: string, email: string, password: string, pixKey?: string) {
    const existing = await driverRepository.findByEmail(email);
    if (existing) {
      if (existing.active) {
        throw new AppError("Já existe um motorista cadastrado com este e-mail.", StatusCodeHttp.CONFLICT);
      } else {
        throw new AppError("Motorista já cadastrado, porém inativo. Use a opção de reativar.", StatusCodeHttp.CONFLICT);
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const driver = await driverRepository.create({ name, email, passwordHash, pixKey });
    
    return driver;
  },

  async deactivate(id: string) {
    const driver = await driverRepository.findById(id);
    if (!driver) {
      throw new AppError("Motorista não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    if (!driver.active) {
      throw new AppError("Motorista já inativo.", StatusCodeHttp.BAD_REQUEST);
    }
    
    await driverRepository.deactivate(id);
    return driver;
  },

  async reactivate(id: string) {
    const driver = await driverRepository.findById(id);
    if (!driver) {
      throw new AppError("Motorista não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    if (driver.active) {
      throw new AppError("Motorista já ativo.", StatusCodeHttp.BAD_REQUEST);
    }
    return driverRepository.reactivate(id);
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