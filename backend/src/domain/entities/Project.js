export class Project {
    constructor({ id, name, contractedHours, allocations = [], requiredRoles = [], sprints = [], milestones = [] }) {
        this.id = id;
        this.name = name;
        this.contractedHours = contractedHours;
        this.allocations = allocations;
        this.requiredRoles = requiredRoles;
        this.sprints = sprints;
        this.milestones = milestones;
    }
}
