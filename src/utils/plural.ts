/** «1 ejercicio», «2 ejercicios». Solo para mostrar: el dato no cambia. */
export const plural = (n: number, singular: string, plural: string = `${singular}s`): string =>
  n === 1 ? singular : plural;
