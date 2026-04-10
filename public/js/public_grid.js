export default class PublicGrid {
    constructor({ cost_per_kwh = 0.2, tariff_growth = 0.05, credit_rate = 0 }) {
        this.operation_cost = 0.0;
        this.energy_credit = 0.0;
        this.energy_to_credit = 0.0;
        this.next_month = 0;

        this.cost_per_kwh = cost_per_kwh;
        this.tariff_growth = tariff_growth;
        this.credit_rate = credit_rate;
    }

    initialize(hour_steps) {
        this.energy_purchased = new Float64Array(hour_steps);
        this.energy_credited = new Float64Array(hour_steps);
        this.energy_compensated = new Float64Array(hour_steps);
        this.meet_demand = new Float64Array(hour_steps);
        this.operation_cost = 0.0;
        this.energy_credit = 0.0;
        this.energy_to_credit = 0.0;
        this.next_month = 0;
    }

    update_month(t) {
        const month_number = Math.floor(t / 720);

        if (this.next_month < month_number) {
            this.next_month = month_number;
            this.energy_credit += this.energy_to_credit;
            this.energy_credited[t] = this.energy_to_credit;
            this.energy_to_credit = 0.0;
        }
    }

    export_energy(surplus_energy, inverter_efficiency, t) {
        this.energy_to_credit +=
            surplus_energy * inverter_efficiency * this.credit_rate;
        this.update_month(t);

        return 0.0;
    }

    import_energy(energy_demanded, t) {
        const compensated = Math.min(energy_demanded, this.energy_credit);
        this.energy_compensated[t] = compensated;
        this.energy_credit -= compensated;
        const energy_to_purchase = energy_demanded - compensated;
        this.energy_purchased[t] = energy_to_purchase;
        this.meet_demand[t] = compensated + energy_to_purchase;
        this.operation_cost += energy_to_purchase * this.cost_per_kwh;
        this.update_month(t);
    }

    economic_analysis(project_lifetime, discount_rate) {
        let NPV;
        if (this.tariff_growth === discount_rate) {
            NPV = this.operation_cost * project_lifetime;
        } else {
            NPV =
                ((this.operation_cost * (1 + discount_rate)) /
                    (discount_rate - this.tariff_growth)) *
                (1 -
                    ((1 + this.tariff_growth) / (1 + discount_rate)) **
                        project_lifetime);
        }

        return NPV;
    }
}
