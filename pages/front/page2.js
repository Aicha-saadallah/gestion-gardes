import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const members = [
  { id: 1, name: "Derek Shepherd", maxShifts: 4, unavailabilities: 3 },
  { id: 2, name: "Emilie Patakis", maxShifts: 2, unavailabilities: 5 },
  { id: 3, name: "Gregory House", maxShifts: 4, unavailabilities: 8 },
  { id: 4, name: "Marc Derivard", maxShifts: 4, unavailabilities: 6 },
  { id: 5, name: "Meredith Grey", maxShifts: 4, unavailabilities: 10 },
  { id: 6, name: "Olivier Burdat", maxShifts: 4, unavailabilities: 2 },
  { id: 7, name: "Richard Webber", maxShifts: 4, unavailabilities: 4 },
];

export default function TableComponent() {
  const [data, setData] = useState(members);

  return (
    <div className="container mt-4">
      <table className="table table-striped table-bordered">
        <thead className="thead-light">
          <tr>
            <th>Membre</th>
            <th>Nb gardes max par mois</th>
            <th>Disponibilités</th>
            <th>Certains jours uniquement</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((member) => (
            <tr key={member.id} className={member.name === "Gregory House" ? "table-success" : ""}>
              <td>{member.name}</td>
              <td>
                <input type="number" className="form-control" value={member.maxShifts} readOnly />
              </td>
              <td>
                <span className="badge bg-warning text-dark">{member.unavailabilities} Indisponibilités</span>
                <button className="btn btn-light btn-sm ms-2">Saisie des disponibilités ▼</button>
              </td>
              <td>
                <select className="form-select">
                  <option>Aucune restriction</option>
                  <option>Week-ends seulement</option>
                  <option>Jours de semaine seulement</option>
                </select>
              </td>
              <td>
                <button className="btn btn-danger btn-sm">✖ supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
