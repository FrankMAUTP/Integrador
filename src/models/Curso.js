class Curso {
  constructor({ id, name, color, userId, competencias, createdAt } = {}) {
    this.id = id;
    this.name = name;
    this.color = color || null;
    this.userId = userId || null;
    this.competencias = competencias || {};
    this.createdAt = createdAt || null;
  }

  static fromRow(row, competencias = {}) {
    return new Curso({
      id: row.id,
      name: row.nombre,
      color: row.color,
      userId: row.id_usuario,
      competencias,
      createdAt: row.creado_en,
    });
  }
}

module.exports = Curso;
