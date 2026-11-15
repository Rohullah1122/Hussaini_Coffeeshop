import "../styles/menu.css";
// Drawn picture for each menu item (until real photos are added in public/images)
const ALcolors = {1: "#E9D8C4",2: "#DDE8D3",3: "#F3DFC6",4: "#F2D3CF"};


const Cup = () => (
    <g>
        <path d="M18 30h36v6c0 12-8 20-18 20s-18-8-18-20z" fill="#FFFDF9" stroke="#3B2A20" strokeWidth="3" />
        <path d="M54 34h4a6 6 0 0 1 0 12h-6" fill="none" stroke="#3B2A20" strokeWidth="3" />
        <path d="M22 30h28" stroke="#C8874A" strokeWidth="5" />
        <path className="steamline" d="M30 24c-3-4 3-6 0-10" fill="none" stroke="#6B4A36" strokeWidth="2.5" strokeLinecap="round" />
        <path className="steamline delay" d="M40 24c-3-4 3-6 0-10" fill="none" stroke="#6B4A36" strokeWidth="2.5" strokeLinecap="round" />
    </g>
);

const Toast = () => (
    <g>
        <rect x="16" y="22" width="40" height="32" rx="10" fill="#E8C08A" stroke="#3B2A20" strokeWidth="3" />
        <ellipse cx="36" cy="40" rx="12" ry="8" fill="#9BBF6A" />
        <circle cx="31" cy="39" r="2.5" fill="#C94F3D" />
        <circle cx="40" cy="42" r="2.5" fill="#C94F3D" />
    </g>
);

const Sandwich = () => (
    <g>
        <path d="M14 34 36 18l22 16z" fill="#E8C08A" stroke="#3B2A20" strokeWidth="3" strokeLinejoin="round" />
        <rect x="14" y="34" width="44" height="6" fill="#9BBF6A" />
        <rect x="14" y="40" width="44" height="5" fill="#C94F3D" />
        <rect x="14" y="45" width="44" height="8" rx="3" fill="#E8C08A" stroke="#3B2A20" strokeWidth="3" />
    </g>
);

const Pastry = () => (
    <g>
        <path d="M12 44c4-16 14-24 24-24s20 8 24 24c-6 4-14 6-24 6s-18-2-24-6z" fill="#E3A85E" stroke="#3B2A20" strokeWidth="3" strokeLinejoin="round" />
        <path d="M26 26c2 8 2 16 0 22M36 22v28M46 26c-2 8-2 16 0 22" fill="none" stroke="#B9783A" strokeWidth="2.5" />
    </g>
);


const FoodIcon = ({categoryid,size = 72}) => {
    const art = {1: <Cup />,2: <Toast />,3: <Sandwich />,4: <Pastry />}[categoryid] || <Cup />;

    return (
        <div className="foodicon" style={{background: ALcolors[categoryid] || "#E9D8C4"}} aria-hidden="true">
            <svg width={size} height={size} viewBox="0 0 72 72">{art}</svg>
        </div>
    );
};

export default FoodIcon;
