class Actividad {
  constructor({ id, name, bimestre, competenciaIdx, type, dueDate, weight } = {}) {
    this.id = id;
    this.name = name;
    this.bimestre = bimestre;
    this.competenciaIdx = competenciaIdx ?? 0;
    this.type = type;
    this.dueDate = dueDate || null;
    this.weight = weight || '';
  }
}

module.exports = Actividad;
