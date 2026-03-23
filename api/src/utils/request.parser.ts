import { ValidationError } from "./errors";

export const parseIdParam = (param: string): number => {
  const id = parseInt(param, 10);
  if (isNaN(id)) {
    throw new ValidationError(`Invalid id: "${param}"`);
  }
  return id;
};
