const ProfileAvatar = ({
  avatarSource,
  avatarLetter,
  large = false
}) => {
  return <div className={large ? "account-profile-avatar profile-avatar-image-wrapper" : "account-avatar profile-avatar-image-wrapper"}>
      {avatarSource ? <img src={avatarSource} alt="Ảnh đại diện" className="profile-avatar-image" /> : <span>{avatarLetter}</span>}
    </div>;
};
export { ProfileAvatar };
