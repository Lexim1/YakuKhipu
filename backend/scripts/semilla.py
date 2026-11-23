"""Carga anterior retirada. Los datos se generan como SQL para ejecución manual."""
def cargar(*args, **kwargs):
    raise RuntimeError('No se admiten semillas demo. Usa python -m scripts.generar_sql --help.')


if __name__ == '__main__':
    raise SystemExit('Usa python -m scripts.generar_sql --help y ejecuta los SQL manualmente.')
