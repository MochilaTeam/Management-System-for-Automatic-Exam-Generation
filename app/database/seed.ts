import { sequelize } from './database';
import { getHasher } from '../core/security/hasher';
import { User } from '../infrastructure/user/models';
import { Roles } from '../shared/enums/rolesEnum';

async function seed() {
    await sequelize.authenticate();
    const t = await sequelize.transaction();

    try {
        const hasher = getHasher();
        const passwordHash = await hasher.hash('123456789C');

        await User.findOrCreate({
            where: { email: 'admin@gmail.com' },
            defaults: {
                name: 'admin',
                email: 'admin@gmail.com',
                passwordHash,
                role: Roles.ADMIN,
            },
            transaction: t,
        });

        await t.commit();
        console.log('Seed completado con éxito (usuario admin)');
    } catch (err) {
        await t.rollback();
        console.error('Seed falló:', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();
