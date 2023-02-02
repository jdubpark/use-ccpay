# Server Structure

## Components

Aggregate of all critical functionalities of the server API. Each component folder in `components` have four files:

- `index.ts`
- `controller.ts`
- `server.ts`
- `validator.ts`

### index.ts
Used for simplifying exports of other three files.

### controller.ts
A controller script is the *presentation layer* of a component. It contains a class of static functions called directly by routes (endpoints) upon successful input validation.

For each route function, a controller function takes in the request input, calls some related *service* functions, and returns the data back to the route (which is served to the user).

### service.ts
A service script is the *business layer* of a component. It contains a class of non-static/static functions called by controllers.

A service function executes application logics and interacts with the *data layer* of the server (in `db` folder). In a nutshell, a service function should execute all functions and programs needed to produce the requested data/actions from a user.

A service function should **never** directly write to the database (use *data layer* instead). It should also **never** directly serve its output to the user (use *presentation layer* instead).

### validators.ts
A series of `joi` validations used to validate & reject invalid inputs.

### *note*
Similar tasks serving a common endpoint are clustered into a component folder. For example, `kyc` component contains all controllers, services, and validators that strictly relate to the `kyc` functionality of the server API.

## DB

A folder for isolating database-related tasks & connections. It contains the *data layer* of the server.

All queries that read/write to the database **must** be written in this folder. Such queries can be used interoperably on the `service layer`. 

Service logics should **never** directly write to the database. For example, no SQL executed in the service function, instead call a db function from `db` folder.

## Helpers 

A folder of miscellaneous *standalone scripts* that serve a functional need in server. Middlewares are classfied as helpers.

## Routes

The route file (`index.ts`) defines how endpoints should behave when requests come in. The route file has many routes and each includes:

- **Endpoint**
	- `/ping`, `/kyc/callback`, etc.
	- METHOD: `GET`, `POST`, etc.
- **Expected Input**
	- Validated by the `celebrate` middleware that uses `joi`)
- **Controller**
	- A function to be called when input validation succeeds

In the case that the endpoint doesn't exist or input validation fails, the error middleware is served (in `app.ts`).

## Types

TypeScript types clustered and imported in various places (avoids cyclic dependencies). Some types are declared globally and can be used without imports, such as `ExpReq` and `ExpRes` representing `express` types.

## Utils

A folder of miscellaneous *standalone functions* used as a part of larger functions & goals. Helper functions are used repetitively, hence they are pulled out & clustered into this folder.

## OTHER: Plugins

The `plugins` folder classify all standalone components of the server. For example, if we create an data scraping that grabs data from BLS, it falls under a unique `bls` folder in `plugins`.