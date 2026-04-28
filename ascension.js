const { writeFileSync } = require('fs');
const { MONSTER_EPIC_TYPE } = require('./utils');
const STARTOWER = require('./EN/bin/StarTower.json');
const STARTOWERGROUP = require('./EN/bin/StarTowerGroup.json');
const PREVIEWMONSTERGROUP = require('./EN/bin/PreviewMonsterGroup.json');
const MONSTER = require('./EN/bin/Monster.json');
const MONSTERMANUAL = require('./EN/bin/MonsterManual.json');
const MONSTERSKIN = require('./EN/bin/MonsterSkin.json');
const MONSTERVALUETEMPLETE = require('./EN/bin/MonsterValueTemplete.json');
const MONSTERVALUETEMPLETEADJUST = require('./EN/bin/MonsterValueTempleteAdjust.json');
const LANG_STARTOWER = require('./EN/language/en_US/StarTower.json');
const LANG_STARTOWERGROUP = require('./EN/language/en_US/StarTowerGroup.json');
const LANG_UITEXT = require('./EN/language/en_US/UIText.json');
const LANG_MONSTERMANUAL = require('./EN/language/en_US/MonsterManual.json');

const ascension = {};

for (const ascensionGroupId in STARTOWERGROUP) {
    ascension[ascensionGroupId] = {
        name: LANG_STARTOWERGROUP[STARTOWERGROUP[ascensionGroupId].Name],
        icon: STARTOWERGROUP[ascensionGroupId].CoverImage.split('/').pop(),
        weakTo: STARTOWERGROUP[ascensionGroupId].EET?.length ? STARTOWERGROUP[ascensionGroupId].EET.map(type => LANG_UITEXT[`UIText.T_Element_Attr_${type}.1`]) : ['None'],
        diff: getAscensionDiff(ascensionGroupId),
    };
}

writeFileSync('./ascension.json', JSON.stringify(ascension, null, 4));

function getAscensionDiff(ascensionGroupId) {
    const ascensionDiffKeys = Object.keys(STARTOWER).filter(key => STARTOWER[key].GroupId === +ascensionGroupId);

    return ascensionDiffKeys.map(ascensionDiffKey => ({
        name: `[${LANG_STARTOWER[STARTOWER[ascensionDiffKey].Name]}] Difficulty ${STARTOWER[ascensionDiffKey].Difficulty}`,
        icon: STARTOWER[ascensionDiffKey].Image.split('/').pop(),
        diff: STARTOWER[ascensionDiffKey].Difficulty,
        weakTo: STARTOWER[ascensionDiffKey].EET?.length ? STARTOWER[ascensionDiffKey].EET.map(type => LANG_UITEXT[`UIText.T_Element_Attr_${type}.1`]) : ['None'],
        resistTo: STARTOWER[ascensionDiffKey].NotEET?.map(type => LANG_UITEXT[`UIText.T_Element_Attr_${type}.1`]) || ['None'],
        monster: getAscensionMonster(STARTOWER[ascensionDiffKey].PreviewMonsterGroupId, ascensionGroupId, STARTOWER[ascensionDiffKey].ValueDifficulty),
    }));
}

function getAscensionMonster(previewMonsterGroupId, ascensionGroupId, valueDifficulty) {
    const monsterIds = PREVIEWMONSTERGROUP[previewMonsterGroupId].MonsterIds;

    monsterIds.sort((a, b) => {
        const epicDiff = MONSTER[a].EpicLv - MONSTER[b].EpicLv;
        return epicDiff !== 0 ? epicDiff : a - b;
    });

    return monsterIds.map(monsterId => {
        const monster = MONSTER[monsterId];
        const monsterManual = MONSTERMANUAL[MONSTERSKIN[monster.FAId].MonsterManual];
        const monsterValueTemplateAdjust = MONSTERVALUETEMPLETEADJUST[monster.Templete];
        const monsterValueTemplate = MONSTERVALUETEMPLETE[Object.keys(MONSTERVALUETEMPLETE).filter(key => key === `${monsterValueTemplateAdjust.TemplateId * 1000 + ascensionGroupId * 10 + valueDifficulty}`)[0]];

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
