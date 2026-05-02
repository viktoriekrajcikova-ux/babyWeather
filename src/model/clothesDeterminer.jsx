class ClothesDeterminer {

    clothes = [

        // summer
        {name: 'shirt', imageUrl: 'assets/img/shirt.png', tempFrom: 20, tempTo: null, ageFrom: 1, ageTo: null, sex: null},
        {name: 'shorts', imageUrl: 'assets/img/shorts.png', tempFrom: 20, tempTo: null, ageFrom: 1, ageTo: null, sex: 'male'},
        {name: 'skirt', imageUrl: 'assets/img/skirt.png', tempFrom: 20, tempTo: null, ageFrom: 1, ageTo: null, sex: 'female'},
        {name: 'hat', imageUrl: 'assets/img/hat.png', tempFrom: 20, tempTo: null, ageFrom: 1, ageTo: null, sex: null},
        {name: 'sandals', imageUrl: 'assets/img/sandals.png', tempFrom: 20, tempTo: null, ageFrom: 1, ageTo: null, sex: null},
        {name: 'baby clothes', imageUrl: 'assets/img/babyClothes.png', tempFrom: 20, tempTo: null, ageFrom: 0, ageTo: 1, sex: null},

        // winter
        {name: 'snow boots', imageUrl: 'assets/img/boots.png', tempFrom: null, tempTo: 10, ageFrom: 1, ageTo: null, sex: null},
        {name: 'long shirt', imageUrl: 'assets/img/longShirt.png', tempFrom: null, tempTo: 16, ageFrom: null, ageTo: null, sex: null},
        {name: 'singlet', imageUrl: 'assets/img/singlet.png', tempFrom: null, tempTo: 16, ageFrom: null, ageTo: null, sex: null},
        {name: 'snowsuit', imageUrl: 'assets/img/snowsuit.png', tempFrom: null, tempTo: 15, ageFrom: null, ageTo: 1, sex: null},
        {name: 'tights', imageUrl: 'assets/img/tights.png', tempFrom: null, tempTo: 15, ageFrom: null, ageTo: null, sex: null},
        {name: 'winter hat', imageUrl: 'assets/img/winterHat.png', tempFrom: null, tempTo: 10, ageFrom: null, ageTo: null, sex: null},
        {name: 'glove', imageUrl: 'assets/img/glove.png', tempFrom: null, tempTo: 13, ageFrom: 1, ageTo: null, sex: null},
        {name: 'winter jacket', imageUrl: 'assets/img/winterJacket.png', tempFrom: null, tempTo: 13, ageFrom: 1, ageTo: null, sex: null},
        {name: 'winter pants', imageUrl: 'assets/img/winterPants.png', tempFrom: null, tempTo: 13, ageFrom: 1, ageTo: null, sex: null},

        // autumn, spring
        {name: 'sweater', imageUrl: 'assets/img/sweater.png', tempFrom: 13, tempTo: 17, ageFrom: null, ageTo: null, sex: null},
        {name: 'socks', imageUrl: 'assets/img/socks.png', tempFrom: null, tempTo: 17, ageFrom: null, ageTo: null, sex: null},
    ];

    getSuitableClothes(temperature, age, sex) {
        return this.clothes.filter(function (clothesItem) {
            return (clothesItem.tempFrom <= temperature || clothesItem.tempFrom === null) &&
                (clothesItem.tempTo >= temperature || clothesItem.tempTo === null) &&
                (clothesItem.ageFrom <= age || clothesItem.ageFrom === null) &&
                (clothesItem.ageTo >= age ||  clothesItem.ageTo === null) &&
                (clothesItem.sex === sex ||  clothesItem.sex === null)

        })
    }

}

export const determinator = new ClothesDeterminer();
