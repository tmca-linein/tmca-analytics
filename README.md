npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-url "postgresql://tmca_analytics_prod:PASSWORD@localhost:5433/tmcaanalytics" --script > prisma/migrations/0_init/migration.s
