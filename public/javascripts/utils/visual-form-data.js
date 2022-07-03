class VisualFormData {
    /**
     * A more useful FormData Class.
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
     * Get the data via name.
     * @param {String} name - Name in the form.
     * @returns The key-value param data.
     */
    get(name) {
        for (const content of this.fullData)
            if (content.name == name)
                return content;
    }
    /**
     * Set the new key-value param
     * @param {String} name - Name in the form.
     * @param {String} key - Key in the form.
     * @param {*} value - Value in the form.
     * @returns The key-value param data.
     */
    attr(name, key, value) {
        for (const content of this.fullData)
            if (content.name == name) {
                content[key] = value;
                return content;
            }
    }
    /**
     * Get the value via name.
     * @param {String} name - Name in the form.
     * @returns The value to the name.
     */
    getValue(name) {
        for (const content of this.fullData)
            if (content.name == name)
                return content.value;
    }
    /**
     * Change the value according to name.
     * @param {String} name - Name in the form.
     * @param {any} value - The value to the name.
     * @returns The value to the name.
     */
    setValue(name, value) {
        for (const key in this.fullData)
            if (this.fullData[key].name == name)
                return this.fullData[key].value = value;
    }
    /**
     * Delete a key-value param via name.
     * @param {String} name - Name in the form.
     * @returns - The key-value param data.
     */
    delete(name) {
        for (const key in this.fullData)
            if (this.fullData[key].name == name) {
                this.fullData.splice(key, 1);
                return this.fullData[key];
            }
    }
    /**
     * Rename a key name.
     * @param {String} name - Name in the form.
     * @param {String} renamed_name - The renamed key name.
     * @returns - The key-value param data.
     */
    rename(name, renamed_name) {
        for (const key in this.fullData)
            if (this.fullData[key].name == name) {
                this.fullData[key].name = renamed_name;
                return this.fullData[key];
            }
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