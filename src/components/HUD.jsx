import React from "react";

export default function HUD({ player, kills, elapsed, skills }) {
  if (!player) return null;

  const { hp = 0, maxHp = 1, mana = 0, maxMana = 1 } = player;

  const hpPercent = Math.min(hp / maxHp, 1) * 100;
  const manaPercent = Math.min(mana / maxMana, 1) * 100;

  return (
    <div className="absolute top-4 left-4 text-white font-bold select-none">
      {/* Health Bar */}
      <div className="mb-2">
        <div className="w-48 h-6 bg-gray-800 border border-white relative">
          <div className="h-6 bg-red-600" style={{ width: `${hpPercent}%` }} />
          <span className="absolute inset-0 flex items-center justify-center text-sm">
            {Math.floor(hp)} / {maxHp} HP
          </span>
        </div>
      </div>

      {/* Mana Bar */}
      <div className="mb-4">
        <div className="w-48 h-6 bg-gray-800 border border-white relative">
          <div className="h-6 bg-blue-600" style={{ width: `${manaPercent}%` }} />
          <span className="absolute inset-0 flex items-center justify-center text-sm">
            {Math.floor(mana)} / {maxMana} Mana
          </span>
        </div>
      </div>

      {/* Kills */}
      <div className="mb-2 text-lg">Kills: {kills}</div>

      {/* Timer */}
      <div className="mb-4 text-lg">Time: {elapsed}s</div>

      {/* Skills */}
      <div className="flex gap-2">
        {["Q", "W", "E", "R"].map((key) => {
          const cd = skills?.cooldowns?.[key.toLowerCase()] || 0;
          const percent = Math.min(cd / (skills?.maxCooldown?.[key.toLowerCase()] || 1), 1);

          return (
            <div
              key={key}
              className="relative w-12 h-12 bg-gray-800 border border-white flex items-center justify-center text-white font-bold"
            >
              {key}
              {cd > 0 && (
                <div
                  className="absolute inset-0 bg-black opacity-60 flex items-center justify-center text-sm"
                  style={{ height: `${percent * 100}%`, top: 0 }}
                >
                  {Math.ceil(cd / 60)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
