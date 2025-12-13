export class Collaborator {
    constructor({ id, name, contractedHours, skills = [], allocations = [], roles = [] }) {
        this.id = id;
        this.name = name;
        this.contractedHours = contractedHours;
        this.skills = skills;
        this.allocations = allocations;
        this.roles = roles;
    }
}
