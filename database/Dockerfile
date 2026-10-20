FROM postgres:16-alpine

LABEL maintainer="IFPB Campina Grande - HIFCG"
LABEL description="Banco de dados PostgreSQL pré-configurado com schema e tabelas do HIFCG"

ENV POSTGRES_DB=hifcgdb
ENV POSTGRES_USER=hifcg
ENV POSTGRES_PASSWORD=hifcg123

# Copia o script de criação das tabelas e inserção dos dados iniciais
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

EXPOSE 5432
