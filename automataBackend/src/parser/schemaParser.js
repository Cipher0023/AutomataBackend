/**
 * Parser para arquivos schema.prisma
 * Extrai informações sobre models, campos e relações
 */

export class SchemaParser {
  constructor(schemaContent) {
    this.schemaContent = schemaContent;
    this.models = [];
  }

  /**
   * Faz o parsing completo do schema
   */
  parse() {
    const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
    let match;

    while ((match = modelRegex.exec(this.schemaContent)) !== null) {
      const modelName = match[1];
      const modelBody = match[2];
      
      const model = {
        name: modelName,
        fields: this.parseFields(modelBody),
        relations: []
      };

      this.models.push(model);
    }

    return this.models;
  }

  /**
   * Faz o parsing dos campos de um model
   */
  parseFields(modelBody) {
    const fields = [];
    const lines = modelBody.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));

    for (const line of lines) {
      // Ignora linhas de comentário e relações
      if (line.startsWith('//') || line.includes('@relation')) {
        continue;
      }

      const fieldMatch = line.match(/^(\w+)\s+(\w+)(\[\])?([\?\!])?/);
      if (fieldMatch) {
        const [, fieldName, fieldType, isArray, modifier] = fieldMatch;
        
        const field = {
          name: fieldName,
          type: fieldType,
          isArray: !!isArray,
          isOptional: modifier === '?',
          isRequired: modifier === '!',
          isId: line.includes('@id'),
          isUnique: line.includes('@unique'),
          hasDefault: line.includes('@default'),
          isRelation: line.includes('@relation') || line.includes('@db.ObjectId')
        };

        // Extrai valor default se existir
        if (field.hasDefault) {
          const defaultMatch = line.match(/@default\(([^)]+)\)/);
          if (defaultMatch) {
            field.defaultValue = defaultMatch[1];
          }
        }

        fields.push(field);
      }
    }

    return fields;
  }

  /**
   * Retorna todos os models encontrados
   */
  getModels() {
    return this.models;
  }

  /**
   * Retorna um model específico pelo nome
   */
  getModel(modelName) {
    return this.models.find(m => m.name === modelName);
  }

  /**
   * Retorna os campos de um model que não são relações
   */
  getDataFields(modelName) {
    const model = this.getModel(modelName);
    if (!model) return [];
    
    return model.fields.filter(f => 
      !f.isId && 
      !f.name.includes('_at') && 
      !f.isRelation &&
      f.type !== 'Json'
    );
  }

  /**
   * Retorna os campos obrigatórios de um model
   */
  getRequiredFields(modelName) {
    const dataFields = this.getDataFields(modelName);
    return dataFields.filter(f => !f.isOptional && !f.hasDefault);
  }
}
