export default function CharacterCard({ character, selected, onClick }) {
  return (
    <div
      className={`w-36 h-44 p-4 flex flex-col items-center justify-center cursor-pointer border-4 ${
        selected ? "border-yellow-400" : "border-gray-800"
      } rounded-lg`}
      onClick={onClick}
    >
      {character.sprite ? (
        <img
          src={character.sprite}
          alt={character.name}
          className="w-16 h-16 rounded-full mb-4 object-cover"
        />
      ) : (
        <div
          className="w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: character.color }}
        />
      )}

      <span className="text-lg font-bold">{character.name}</span>
      <span className="text-sm">HP: {character.maxHp}</span>
      <span className="text-sm">Speed: {character.speed}</span>
    </div>
  );
}
