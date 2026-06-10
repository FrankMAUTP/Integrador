class Usuario {
  constructor({ id, username, displayName, email, rol, activo, createdAt, photo } = {}) {
    this.id = id;
    this.username = username;
    this.displayName = displayName || username;
    this.email = email;
    this.rol = rol || 'docente';
    this.activo = activo !== undefined ? !!activo : true;
    this.createdAt = createdAt;
    if (photo) this.photo = photo;
  }

  toPublic() {
    return {
      id: this.id,
      username: this.username,
      displayName: this.displayName,
      email: this.email,
      rol: this.rol,
    };
  }

  static fromRow(row) {
    return new Usuario({
      id: row.id,
      username: row.usuario,
      displayName: row.nombre_display,
      email: row.correo,
      rol: row.rol,
      activo: row.activo,
      createdAt: row.creado_en,
      photo: row.foto,
    });
  }
}

module.exports = Usuario;
