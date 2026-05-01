document.getElementById('profilePictureForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('profilePictureInput');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const profilePicture = document.getElementById('profilePicture');
            profilePicture.src = e.target.result;
            closeProfilePictureModal();
        };

        reader.readAsDataURL(file);
    }
});

function openProfilePictureModal() {
    document.getElementById('profilePictureModal').style.display = 'block';
}

function closeProfilePictureModal() {
    document.getElementById('profilePictureModal').style.display = 'none';
}