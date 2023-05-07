import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prefix = '/api/post-service';

  app.enableCors({ origin: '*' });
  app.setGlobalPrefix(prefix);

  const config = new DocumentBuilder()
    .setTitle('Post Service API')
    .setDescription('Post Service API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/swagger`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(+process.env.PORT || 5000);
  console.log('PostService is running');
}
bootstrap();
