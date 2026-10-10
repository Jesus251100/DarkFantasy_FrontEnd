import type { IConsultasAdmin } from '../domain/admin/IConsultasAdmin'

export class ConsultarAdmin {
  constructor(private readonly consultas: IConsultasAdmin) {}

  usuarios() {
    return this.consultas.listarUsuarios()
  }

  reportes() {
    return this.consultas.reportes()
  }

  actividad() {
    return this.consultas.actividad()
  }
}
