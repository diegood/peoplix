import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver } from 'graphql';

const ADMIN_ROLE = 1;

export function authDirectiveTransformer(schema, directiveName) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];

      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        const { requires, sameUser } = authDirective;

        fieldConfig.resolve = async function (source, args, context, info) {
          if (!context.user) {
            throw new Error('Unauthorized');
          }

          if (requires === 'ADMIN') {
             if (!context.user.isSuperAdmin && context.user.role > ADMIN_ROLE) {
                 let isSameUser = false;
                 if (sameUser) {
                     const targetId = args[sameUser];
                     if (targetId && targetId === context.user.id) { isSameUser = true }
                     if (sameUser === 'id' && args.id === context.user.id) { isSameUser = true }
                     if (sameUser === 'collaboratorId' && args.collaboratorId === context.user.id) { isSameUser = true }
                 }
                 if (!isSameUser) { throw new Error('Unauthorized: Admin access required') }
             }
          }

          if (requires === 'SUPER_ADMIN') {
               if (!context.user.isSuperAdmin) { throw new Error('Unauthorized: Super Admin access required') }
          }
          if (requires === 'USER') { }
          return resolve(source, args, context, info);
        };
        return fieldConfig;
      }
    },
  });
}
