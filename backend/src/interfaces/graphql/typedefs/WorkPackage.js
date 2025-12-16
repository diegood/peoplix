import gql from 'graphql-tag'

export const WorkPackageSchema = gql`
  type WorkPackage {
    id: ID!
    name: String!
    description: String
    projectId: String!
    tasks: [Task]
    startDate: String
    endDate: String
    highLevelEstimation: Int
    status: String
    createdAt: String
    updatedAt: String
  }

  type Task {
    id: ID!
    name: String!
    description: String
    workPackageId: String
    workPackage: WorkPackage
    estimations: [TaskEstimation]
    startDate: String
    endDate: String
    estimatedHours: Float 
    collaboratorId: String
    collaborator: Collaborator
    dependencies: [Task]
    dependents: [Task]
  }

  type TaskEstimation {
    id: ID!
    taskId: String!
    roleId: String!
    role: Role
    hours: Float!
  }

  extend type Query {
    projectWorkPackages(projectId: ID!): [WorkPackage]
    task(id: ID!): Task
  }

  extend type Mutation {
    createWorkPackage(projectId: ID!, name: String!, description: String, highLevelEstimation: Int, startDate: String): WorkPackage
    updateWorkPackage(id: ID!, name: String, description: String, highLevelEstimation: Int, startDate: String, status: String): WorkPackage
    deleteWorkPackage(id: ID!): Boolean

    createTask(workPackageId: ID, name: String!, description: String, startDate: String, collaboratorId: ID): Task
    updateTask(id: ID!, name: String, description: String, startDate: String, collaboratorId: ID): Task
    deleteTask(id: ID!): Boolean

    estimateTask(taskId: ID!, roleId: ID!, hours: Float!): Task
    
    addTaskDependency(taskId: ID!, predecessorId: ID!): Task
    removeTaskDependency(taskId: ID!, predecessorId: ID!): Task
  }
`
