class Alumno {
  constructor({ id, name, observation, retired } = {}) {
    this.id = id;
    this.name = name;
    if (observation) this.observation = observation;
    if (retired) this.retired = true;
  }

  static fromRow(row) {
    return new Alumno({
      id: row.id,
      name: row.nombre,
      observation: row.observacion,
      retired: !!row.retirado,
    });
  }
}

module.exports = Alumno;
