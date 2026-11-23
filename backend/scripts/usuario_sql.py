"""Emite INSERT para un usuario real, sin conectar a PostgreSQL."""
import argparse
import getpass
from app.core.passwords import hash_password
from scripts.generar_sql import insert


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--id',required=True)
    parser.add_argument('--nombre',required=True)
    parser.add_argument('--perfil',required=True,choices=['sunass','eps'])
    parser.add_argument('--eps-id')
    args=parser.parse_args()
    if (args.perfil=='eps') != bool(args.eps_id): parser.error('EPS requiere --eps-id; SUNASS no lo usa.')
    password=getpass.getpass('Contraseña (mínimo 12 caracteres): ')
    print(insert('usuario',dict(id=args.id,nombre_visible=args.nombre,perfil=args.perfil,eps_id=args.eps_id,password_hash=hash_password(password))))


if __name__=='__main__': main()
