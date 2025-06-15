add migrations
```
npx typeorm migration:create src/migrations/
```
start up
```
npx typeorm migration:run -d dist/ormconfig.js
```
npx typeorm migration:revert -d src/data-source.ts