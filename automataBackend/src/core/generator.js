import { SchemaParser } from '../parser/schemaParser.js';
import { ControllerGenerator } from '../generators/controllerGenerator.js';
import { ServiceGenerator } from '../generators/serviceGenerator.js';
import { RouteGenerator } from '../generators/routeGenerator.js';
import { FileWriter } from '../generators/fileWriter.js';

/**
 * Classe principal que orquestra a geração do backend
 */
export class BackendGenerator {
  constructor(schemaContent, config = {}) {
    this.schemaContent = schemaContent;
    this.config = config;
    this.parser = new SchemaParser(schemaContent);
    this.fileWriter = new FileWriter(config.outputDir || 'output');
  }

  /**
   * Executa a geração completa do backend
   */
  async generate() {
    const result = {
      success: false,
      message: '',
      files: [],
      models: [],
      errors: []
    };

    try {
      // 1. Parse do schema
      console.log('📖 Fazendo parse do schema...');
      const models = this.parser.parse();
      
      if (models.length === 0) {
        throw new Error('Nenhum model encontrado no schema');
      }

      result.models = models.map(m => m.name);
      console.log(`✅ ${models.length} models encontrados: ${result.models.join(', ')}`);

      // 2. Gerar controllers e services para cada model
      console.log('\n🔨 Gerando controllers e services...');
      for (const model of models) {
        console.log(`  - Processando ${model.name}...`);
        
        // Gerar controllers
        const controllerGen = new ControllerGenerator(model);
        const controllers = controllerGen.generateAll();
        const controllerFiles = this.fileWriter.writeControllers(model.name, controllers);
        result.files.push(...controllerFiles);

        // Gerar service
        const serviceGen = new ServiceGenerator(model);
        const service = serviceGen.generateService();
        const serviceFile = this.fileWriter.writeService(model.name, service);
        result.files.push(serviceFile);
      }

      // 3. Gerar rotas
      console.log('\n🛣️  Gerando rotas...');
      const routeGen = new RouteGenerator(models);
      const publicRoutes = routeGen.generatePublicRoutes();
      const privateRoutes = routeGen.generatePrivateRoutes('user');
      const privateIndex = routeGen.generatePrivateIndex();
      const publicIndex = routeGen.generatePublicIndex();
      
      const routeFiles = this.fileWriter.writeRoutes(
        publicRoutes,
        privateRoutes,
        privateIndex,
        publicIndex
      );
      result.files.push(...routeFiles);

      // 4. Gerar arquivos de configuração
      console.log('\n⚙️  Gerando arquivos de configuração...');
      result.files.push(this.fileWriter.writeSchema(this.schemaContent));
      result.files.push(this.fileWriter.writePrismaClient());
      result.files.push(this.fileWriter.writeServerFile());
      result.files.push(this.fileWriter.writePackageJson());
      result.files.push(this.fileWriter.writeEnvExample());
      result.files.push(this.fileWriter.writeReadme());

      result.success = true;
      result.message = `Backend gerado com sucesso! ${result.files.length} arquivos criados.`;
      result.outputDir = this.fileWriter.getOutputDir();

      console.log(`\n✅ ${result.message}`);
      console.log(`📁 Arquivos salvos em: ${result.outputDir}`);

    } catch (error) {
      result.success = false;
      result.message = `Erro ao gerar backend: ${error.message}`;
      result.errors.push(error.message);
      console.error(`\n❌ ${result.message}`);
    }

    return result;
  }

  /**
   * Retorna informações sobre os models sem gerar arquivos
   */
  analyze() {
    try {
      const models = this.parser.parse();
      
      return {
        success: true,
        models: models.map(model => ({
          name: model.name,
          fieldCount: model.fields.length,
          fields: model.fields.map(f => ({
            name: f.name,
            type: f.type,
            isOptional: f.isOptional,
            isId: f.isId
          }))
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
