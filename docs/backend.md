# Backend Architecture Documentation

## Overview
This documentation provides an overview of the backend architecture, focusing on the core concepts, technical implementation, and how different components interact. It is intended for developers working on or with the backend system.

The backend is built as a GraphQL API server using Python, following clean architecture principles with clear separation of concerns. The system employs a layered architecture that cleanly separates the API interface, domain logic, and persistence concerns, making it maintainable and testable.

## Project Structure

The main application code is organized in the following structure:

```
backend/
├── medconb/            # Main application package
│   ├── domain/         # Domain models and business logic
│   ├── graphql/        # GraphQL schema implementation
│   ├── interactors/    # Use case implementations
│   ├── persistence/    # Data persistence layer
│   ├── server.py       # Server configuration and setup
│   ├── middleware.py   # Request middleware
│   └── types.py        # Common type definitions
├── schema.graphql      # GraphQL schema definition
```

## Technical Stack

- **Web Framework**: Starlette-based GraphQL server
- **Middleware**:
    - Database session management
    - Authentication
    - Request/response handling
- **Authentication**:
    - Azure AD for production
    - Development authentication for testing
    - Token-based authentication
- **Data Access**:
    - SQLAlchemy for database operations
    - Redis for caching
- **API Layer**:
    - GraphQL with Ariadne
    - Custom type system
    - Interactor pattern for business logic

## Request Flow
![Request Flow](res/Architecture - Request Flow.png)

The diagram above shows how requests flow through the system, from the GraphQL API through the various layers to the persistence layer and back.

## API Interface

The application exposes a GraphQL API that provides:

1. **Queries**:
    - User-related queries (self, users)
    - Medical coding system ontology queries
    - Code and codelist management
    - Collection management
    - Search functionality for codes and entities
    - Property management

2. **Mutations**:
    - Collection CRUD operations
    - Phenotype management
    - Codelist operations
    - Change management (commits, transient changes)
    - User profile updates

## Domain Model

### Core Entities

1. **Containers**
    - Organizational structures specifically designed to group and structure Phenotypes and Codelists
    - Support hierarchical organization
    - Can be shared between users
    - Types: Phenotype Collections and Codelist Collections

2. **Users**
    - Represent individuals using the system
    - Have a unique identity and associated workspace
    - Can own and share collections
    - Track user-specific preferences and progress

3. **Workspaces**
    - Personal environments for organizing collections
    - Each user has exactly one workspace
    - Collections can be:
        - Ordered according to user preference
        - Shared with other users
        - Personal (private to the user)
    - Primary organizational unit for accessing collections

4. **Medical Coding Systems (Ontologies)**
    - Standardized medical terminology and coding systems
    - Provide the vocabulary and codes for medical concepts
    - Each ontology has a unique identifier and contains multiple codes

5. **Codelists**
    - Groups of related medical codes from coding systems
    - Version-controlled through commits
    - Components:
        - **Codesets**: Sets of codes from specific medical coding systems that are part of a codelist version
        - **Changesets**: Track additions and removals of codes
        - **Commits**: Record changes with metadata (author, timestamp, message)
    - Support transient (uncommitted) changes
    - Track derivation history (references to original codelists when copied)

6. **Phenotypes**
    - Medical condition descriptions
    - Can be organized in collections
    - Have configurable properties
    - Include operational descriptions that reference one or more codelists
    - Codelists in the operational description define the concrete medical codes that represent the phenotype

7. **Properties**
    - Configurable attributes that can be attached to collections and phenotypes
    - Types: Text, Number, Enum, Time, User
    - Can be required or read-only
    - Support both system-defined and custom properties

### Key Concepts

1. **Version Control**
    - Codelists are version-controlled through commits
    - Changes are tracked as additions and removals of codes
    - Each commit includes author information and timestamp
    - Support for transient changes before committing

2. **Property System**
    - Flexible property system for both collections and phenotypes
    - Support for custom properties
    - Automatic tracking of creation and modification metadata
    - Type validation and constraints

3. **Hierarchical Organization**
    - Collections provide hierarchical structure
    - Support for nested organization of phenotypes and codelists
    - Shared collections for collaboration

## GraphQL Layer and Use Case Implementation

### Architecture Overview
The GraphQL layer connects to the application's use cases through a pattern that separates the GraphQL resolvers from the business logic implementation. This separation is achieved through:

1. **Interactors**: Classes that implement specific use cases (e.g., CreateCollection, UpdatePhenotype)
    - Handle business logic
    - Operate on the domain model
    - Independent of the GraphQL layer
    - Can include input validation and error handling

2. **InteractorResolver**: A bridge between GraphQL and use cases
    - Manages the lifecycle of interactor execution
    - Handles session management
    - Provides access to the authenticated user
    - Converts domain exceptions to GraphQL errors

3. **Custom ObjectType**: A type-safe GraphQL object implementation
    - Extends Ariadne's ObjectType
    - Provides type checking for parent-child relationships
    - Automatically converts between GraphQL and domain types
    - Validates resolver arguments against DTOs

### Implementation Structure

1. **Field Resolution**
    - GraphQL fields are mapped to specific interactors using InteractorResolver
    - Example for a mutation:
        ```python
        mutation.set_field("createCollection", InteractorResolver(interactors.CreateCollection))
        ```
    - Example for a query:
        ```python
        query.set_field("searchCodes", InteractorResolver(interactors.SearchCodes))
        ```

2. **Type Resolution**
    - Object fields are resolved using interactors when needed
    - Type-safe parent-child relationships are enforced
    - Automatic conversion between GraphQL arguments and DTOs

### Resolution Flow

1. **Request Processing**
    - GraphQL receives a query or mutation
    - The appropriate resolver is identified
    - InteractorResolver:
        1. Creates a new interactor instance
        2. Provides database session and user context
        3. Passes any input data (DTO)
        4. Executes the use case
        5. Commits the transaction
        6. Returns the result or handles errors

2. **Type Safety**
    - ObjectType ensures type compatibility between GraphQL and domain types
    - Validates parent-child relationships in nested resolvers
    - Converts GraphQL arguments to strongly-typed DTOs
    - Provides clear error messages for type mismatches

This architecture provides several benefits:
- Clear separation of concerns
- Reusable business logic
- Consistent error handling
- Automatic transaction management
- Strong type safety throughout the resolution chain

## Persistence Layer

The persistence layer is built on SQLAlchemy and follows a clean architecture approach with clear abstractions:

1. **Repository Pattern**
    - Each domain entity has a corresponding repository interface
    - Repositories are defined as Python Protocols
    - Implementation details are hidden behind these interfaces
    - Example repository interfaces:
        - UserRepository
        - CollectionRepository
        - PhenotypeRepository
        - CodelistRepository
        - OntologyRepository

2. **Session Management**
    - Custom SQLAlchemy session implementation
    - Provides convenient access to repositories
    - Handles complex domain relationships (e.g., container-item relationships)
    - Manages transaction boundaries

3. **Caching Layer**
    - Redis-based caching for ontology and code data
    - In-memory caching for property data
    - Implemented through repository decorators
    - Improves performance for frequently accessed data

This abstraction allows for:

- Clear separation between domain and persistence concerns
- Easy testing through repository interfaces
- Flexibility to change the underlying storage implementation
- Efficient data access through caching where needed
