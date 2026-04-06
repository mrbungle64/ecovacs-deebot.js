export = VacBot_950v2type;
/**
 * This class is relevant for 950_v2 type models
 * e.g. Deebot OZMO T80 series (which are all MQTT based models)
 */
declare class VacBot_950v2type extends VacBot {
    run(command: any, ...args: any[]): void;
}
import VacBot = require("../950type/vacBot");
//# sourceMappingURL=vacBot.d.ts.map