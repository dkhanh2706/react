import { Children, cloneElement, isValidElement } from "react";
import "../../styles/admin/ResponsiveAdminTable.css";

function textOf(node) {
  return Children.toArray(node).map((child) => isValidElement(child) ? textOf(child.props.children) : String(child)).join("");
}

export default function ResponsiveAdminTable({ label, children }) {
  const sections = Children.toArray(children.props.children);
  const header = sections.find((section) => section.type === "thead");
  const headings = Children.toArray(Children.toArray(header.props.children)[0].props.children).map((cell) => textOf(cell.props.children));
  const table = cloneElement(children, { "aria-label": label }, sections.map((section) => {
    if (section.type !== "tbody") return section;
    return cloneElement(section, {}, Children.map(section.props.children, (row) => {
      if (!isValidElement(row) || row.type !== "tr") return row;
      return cloneElement(row, {}, Children.map(row.props.children, (cell, index) => {
        if (!isValidElement(cell) || cell.type !== "td" || cell.props.colSpan > 1) return cell;
        return cloneElement(cell, { "data-label": headings[index] });
      }));
    }));
  }));
  return <div className="adm-table-responsive admin-responsive-table">{table}</div>;
}
