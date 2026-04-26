import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Enhancer } from '@nestjs/graphql';
import { join } from 'path';

export class GQLConfig implements ApolloDriverConfig {
  driver = ApolloDriver;
  typePaths = ['./**/*.gql'];
  playground = false;
  plugins = [ApolloServerPluginLandingPageLocalDefault()];
  context = ({ req }) => ({ req });
  formatError = (error) => {
    return {
      message: error.message,
      extensions: {
        ...error.extensions,
        stacktrace: undefined,
      },
    };
  };
  fieldResolverEnhancers: Enhancer[] = ['guards'];
  definitions = {
    path: join(process.cwd(), 'src/graphql.ts'),
  };
}
