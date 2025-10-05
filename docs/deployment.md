

.select('wb.column')        // SELECT wb.column
.where('wb.userId = :id')   // WHERE wb.userId = $1
.setParameter( id: value)  // Bind :id = value (prevents SQL injection)
.orderBy('wb.createdAt')    // ORDER BY wb.created_at
.skip(10)                   // OFFSET 10
.take(20)                   // LIMIT 20
.getQuery()                 // Returns SQL string (doesn't execute)
.getManyAndCount()          // Executes and returns [results, count]

To do:
use datasource to collect all data connect