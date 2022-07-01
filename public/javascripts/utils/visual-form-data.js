class VisualFormData {
    /**
     * A more useful FormData Class
     * @param {Node} form_dom 
     */
    constructor(form_dom) {
        const fullData = [];
        const form_node_lists = form_dom.querySelectorAll("[name]");
        for (let i = 0; i < form_node_lists.length; i++) {
            const element = form_node_lists[i];
            fullData.push({
                name: element.name,
                value: element.type == "checkbox" ? element.checked : element.value,
                type: element.type
            })
        }
        this.fullData = fullData;
    }
    /**
     * Get the value via name.
     * @param {String} name - Name in the form
     * @returns The value to the name.
     */
    get(name) {
        for (const content of this.fullData)
            if (content.name == name)
                return content.value;
    }
    /**
     * Change the value according to name.
     * @param {String} name - Name in the form
     * @param {any} value - The value to the name.
     * @returns The value to the name.
     */
    set(name, value) {
        for (const key in this.fullData)
            if (this.fullData[key].name == name)
                return this.fullData[key].value = value;
    }
    /**
     * Change into key-value (JSON) Format.
     * @returns JSON Object
     */
    getJSONData() {
        const json = {};
        for (const element of this.fullData) {
            json[element.name] = element.value;
        }
        return json;
    }
}