const { writeFileSync } = require('fs');
const { MONSTER_EPIC_TYPE } = require('./utils');
const INFINITYTOWER = require('./EN-data/bin/InfinityTower.json');
const INFINITYTOWERDIFFICULTY = require('./EN-data/bin/InfinityTowerDifficulty.json');
const INFINITYTOWERFLOOR = require('./EN-data/bin/InfinityTowerFloor.json');
const INFINITYTOWERAFFIX = require('./EN-data/bin/InfinityTowerAffix.json');
const PREVIEWMONSTERGROUP = require('./EN-data/bin/PreviewMonsterGroup.json');
const MONSTER = require('./EN-data/bin/Monster.json');
const MONSTERMANUAL = require('./EN-data/bin/MonsterManual.json');
const MONSTERSKIN = require('./EN-data/bin/MonsterSkin.json');
const MONSTERVALUETEMPLETE = require('./EN-data/bin/MonsterValueTemplete.json');
const MONSTERVALUETEMPLETEADJUST = require('./EN-data/bin/MonsterValueTempleteAdjust.json');
const UITEXT = require('./EN-data/bin/UIText.json');
const LANG_INFINITYTOWER = require('./EN-data/language/en_US/InfinityTower.json');
const LANG_INFINITYTOWERDIFFICULTY = require('./EN-data/language/en_US/InfinityTowerDifficulty.json');
const LANG_INFINITYTOWERAFFIX = require('./EN-data/language/en_US/InfinityTowerAffix.json');
const LANG_UITEXT = require('./EN-data/language/en_US/UIText.json');
const LANG_MONSTERMANUAL = require('./EN-data/language/en_US/MonsterManual.json');

const arena = {};

for (const arenaGroupId in INFINITYTOWER) {
    arena[arenaGroupId] = {
        name: LANG_INFINITYTOWER[INFINITYTOWER[arenaGroupId].Name],
        icon: INFINITYTOWER[arenaGroupId].Bg.split('/').pop(),
        weakTo: LANG_UITEXT[`UIText.T_Element_Attr_${INFINITYTOWER[arenaGroupId].ElementType}.1`],
        openDayDesc: LANG_UITEXT[UITEXT[INFINITYTOWER[arenaGroupId].OpenDayDesc].Text],
        openDay: INFINITYTOWER[arenaGroupId].OpenDay.map(day => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]),
        diff: getArenaDiff(arenaGroupId),
    };
}

writeFileSync('./arena.json', JSON.stringify(arena, null, 4));

function getArenaDiff(arenaGroupId) {
    const arenaDiffIds = Object.keys(INFINITYTOWERDIFFICULTY).filter(key => INFINITYTOWERDIFFICULTY[key].TowerId === +arenaGroupId);

    return arenaDiffIds.map(arenaDiffKey => ({
        name: LANG_INFINITYTOWERDIFFICULTY[INFINITYTOWERDIFFICULTY[arenaDiffKey].Name],
        floor: getArenaFloor(arenaDiffKey),
    }));
}

function getArenaFloor(arenaDiffKey) {
    const arenaFloorIds = Object.keys(INFINITYTOWERFLOOR).filter(key => arenaDiffKey * 10 + 1 <= +key && +key <= arenaDiffKey * 10 + 10);

    return arenaFloorIds.map((arenaFloorId, index) => ({
        name: `Floor ${index + 1}`,
        mechanic: INFINITYTOWERFLOOR[arenaFloorId].AffixId.map(affixId => getArenaAffix(affixId)),
        monster: getArenaMonster(INFINITYTOWERFLOOR[arenaFloorId].PreviewMonsterGroupId, INFINITYTOWERFLOOR[arenaFloorId].MonsterLv, INFINITYTOWERFLOOR[arenaFloorId].Stage),
    }));
}

function getArenaAffix(affixId) {
    let desc = LANG_INFINITYTOWERAFFIX[INFINITYTOWERAFFIX[affixId].Desc];

    for (let i = 1; i < 10; i++) {
        desc = desc.replaceAll(`{${i}}`, INFINITYTOWERAFFIX[affixId][`Param${i}`]);
    }

    return {
        name: LANG_INFINITYTOWERAFFIX[INFINITYTOWERAFFIX[affixId].Name],
        desc,
    }
}

function getArenaMonster(previewMonsterGroupId, monsterLv, stage) {
    const monsterIds = PREVIEWMONSTERGROUP[previewMonsterGroupId].MonsterIds;

    monsterIds.sort((a, b) => {
        const epicDiff = MONSTER[a].EpicLv - MONSTER[b].EpicLv;
        return epicDiff !== 0 ? epicDiff : a - b;
    });

    return monsterIds.map(monsterId => {
        const monster = MONSTER[monsterId];
        const monsterManual = MONSTERMANUAL[MONSTERSKIN[monster.FAId].MonsterManual];
        const monsterValueTemplateAdjust = MONSTERVALUETEMPLETEADJUST[monster.Templete];
        const monsterValueTemplate = MONSTERVALUETEMPLETE[Object.keys(MONSTERVALUETEMPLETE).filter(key => key === `${monsterValueTemplateAdjust.TemplateId * 1000 + monsterLv * 10 + stage}`)[0]];

        return {
            name: LANG_MONSTERMANUAL[monsterManual.Name],
            icon: monsterManual.Icon.split('/').pop(),
            type: MONSTER_EPIC_TYPE[monster.EpicLv],
            weakTo: monsterValueTemplateAdjust.WeakEET?.length ? monsterValueTemplateAdjust.WeakEET.map(type => LANG_UITEXT[`UIText.T_Element_Attr_${type}.1`]) : ['None'],
            resistTo: LANG_UITEXT[`UIText.T_Element_Attr_${monsterValueTemplateAdjust.EET}.1`],
            stat: {
                'HP': Math.floor(monsterValueTemplate.Hp * (1 + (monsterValueTemplateAdjust.HpRatio / 10000 || 0)) + (monsterValueTemplateAdjust.HpFix || 0)) || undefined,
                'ATK': Math.floor(monsterValueTemplate.Atk * (1 + (monsterValueTemplateAdjust.AtkRatio / 10000 || 0)) + (monsterValueTemplateAdjust.AtkFix || 0)) || undefined,
                'DEF': monsterValueTemplate.Def || undefined,
                'Hit Rate': monsterValueTemplate.HitRate ? monsterValueTemplate.HitRate / 100 + '%' : undefined,
                'Attack Speed': monsterValueTemplate.AtkSpd ? monsterValueTemplate.AtkSpd / 100 + '%' : undefined,
                'Aqua DMG': monsterValueTemplate.WEE ? monsterValueTemplate.WEE / 100 + '%' : undefined,
                'Ignis DMG': monsterValueTemplate.FEE ? monsterValueTemplate.FEE / 100 + '%' : undefined,
                'Terra DMG': monsterValueTemplate.SEE ? monsterValueTemplate.SEE / 100 + '%' : undefined,
                'Ventus DMG': monsterValueTemplate.AEE ? monsterValueTemplate.AEE / 100 + '%' : undefined,
                'Lux DMG': monsterValueTemplate.LEE ? monsterValueTemplate.LEE / 100 + '%' : undefined,
                'Umbra DMG': monsterValueTemplate.DEE ? monsterValueTemplate.DEE / 100 + '%' : undefined,
                'Mark DMG Taken': monsterValueTemplate.RCDMARKDMG ? monsterValueTemplate.RCDMARKDMG / 100 + '%' : undefined,
                'Resilience': Math.floor(monsterValueTemplate.Toughness * (1 + (monsterValueTemplateAdjust.ToughnessRatio / 10000 || 0)) + (monsterValueTemplateAdjust.ToughnessFix || 0)) || undefined,
                'Aqua RES': monsterValueTemplateAdjust.WERFix || undefined,
                'Ignis RES': monsterValueTemplateAdjust.FERFix || undefined,
                'Terra RES': monsterValueTemplateAdjust.SERFix || undefined,
                'Ventus RES': monsterValueTemplateAdjust.AERFix || undefined,
                'Lux RES': monsterValueTemplateAdjust.LERFix || undefined,
                'Umbra RES': monsterValueTemplateAdjust.DERFix || undefined,
            },
        };
    });
}
