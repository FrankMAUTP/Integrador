class Seccion {
  constructor({ id, grade, letter, createdAt, schedule, competencias } = {}) {
    this.id = id;
    this.grade = grade;
    this.letter = letter;
    this.createdAt = createdAt || null;
    this.schedule = schedule || { days: [], times: {} };
    this.competencias = competencias || {};
  }
}

module.exports = Seccion;
