# Mermaid Diagram Syntax Guide

When creating diagrams, use mermaid syntax in code blocks. Here are correct examples:

## Flowchart

```mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant S as Server
    participant D as Database
    U->>S: Request
    S->>D: Query
    D-->>S: Results
    S-->>U: Response
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start
    Processing --> Success: Complete
    Processing --> Error: Fail
    Success --> [*]
    Error --> Idle: Retry
```

## Class Diagram

```mermaid
classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }
    class Order {
        +Int id
        +Date date
        +process()
    }
    User --> Order: places
```

## Entity Relationship

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ITEM : contains
    USER {
        int id
        string name
    }
    ORDER {
        int id
        date created
    }
```

## Gantt Chart

```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1 :a1, 2024-01-01, 30d
    Task 2 :after a1, 20d
    section Phase 2
    Task 3 :2024-02-01, 15d
```

## Important Rules

1. Always start with the diagram type (flowchart, sequenceDiagram, etc.)
2. Use proper indentation
3. Node IDs should be simple (A, B, C or descriptive like Start, End)
4. Labels go in brackets: `A[Label]` or `A(Rounded)` or `A{Diamond}`
5. Arrows: `-->` for solid, `-.->` for dotted, `==>` for thick
6. For sequence diagrams: `->>` request, `-->>` response
