document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit handler
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#see-more').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#see-more').style.display = 'block';
      
      document.querySelector('#see-more').innerHTML = `
      <ul class="list-group">
        <li class="list-group-item disabled" aria-disabled="true"><strong>From:</strong> ${email.sender}</li>
        <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
        <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
        <li class="list-group-item"<strong>Timestamp:</strong> ${email.timestamp}</li>
        <li class="list-group-item">${email.body}</li>
      </ul>
      `

      // if it is read
      if(!email.read){
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })
      }

      // Archive and Unarchive emails
      const archive_unarchive = document.createElement('button');
      archive_unarchive.innerHTML = email.archived ? "Unarchive" : "Archive";
      archive_unarchive.className = email.archived ? "btn btn-secondary" : "btn btn-info";
      archive_unarchive.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: !email.archived
          })
        })
        .then( () => { load_mailbox('archive')})
      });
      document.querySelector('#see-more').append(archive_unarchive);

      // Add a space element (non-breaking space) between the buttons
      const space = document.createElement('span');
      space.innerHTML = '&nbsp;';
      document.querySelector('#see-more').append(space);

      // To replay an email
      const reply_email = document.createElement('button');
      reply_email.innerHTML = "Reply";
      reply_email.className = "btn btn-primary";
      reply_email.addEventListener('click', function() {
        compose_email();

        document.querySelector('#compose-recipients').value = email.sender;
        let subject_reply = email.subject;
        if(subject_reply.split(' ',1)[0] != "Re:"){
          subject_reply = "Re: " + email.subject;
        }
        document.querySelector('#compose-subject').value = subject_reply;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}\n`;
      });
      document.querySelector('#see-more').append(reply_email);
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#see-more').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Emails from mailbox and from user
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Iterate over every email and create new div for each one
      emails.forEach(singleEmail => {

        console.log(singleEmail);

        // Create div for every email
        const newMail = document.createElement('div');
        newMail.className = "list-group-item";
        newMail.innerHTML = `
          <h4>Sender: ${singleEmail.sender}</h4>
          <h4>Subject: ${singleEmail.subject}</h4>
          <p>${singleEmail.timestamp}</p>
        `;

        // Add the 'read' or 'unread' class based on the email's read status
        if (singleEmail.read) {
          newMail.classList.add('read');
        } else {
          newMail.classList.add('unread');
        }

        // Click event to view the mail
        newMail.addEventListener('click', function() {
          view_email(singleEmail.id);
        }); 
        document.querySelector('#emails-view').append(newMail);      
      })
  });

}

// New  function for sending emails
function send_email(event){
  event.preventDefault();
  
  // For storing fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send info to backend
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });

}
